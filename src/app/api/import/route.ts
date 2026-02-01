import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { supabase } from '@/services/supabase';
import { logger } from '@/lib/logger';
import {
  checkCodeConflict,
  generateConflictErrorMessage,
  generateExpiredCode,
} from '@/utils/conflict';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const term = formData.get('term') as string;
    const skipConflicts = formData.get('skipConflicts') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer);

    const sheets = {
      praktikum: wb.Sheets['praktikum'],
      mk: wb.Sheets['mata_kuliah'],
      asprak: wb.Sheets['asprak'],
      jadwal: wb.Sheets['jadwal'],
      pivot: wb.Sheets['asprak_praktikum'],
    };

    if (!sheets.praktikum || !sheets.mk || !sheets.asprak || !sheets.jadwal || !sheets.pivot) {
      return NextResponse.json(
        {
          error:
            'Missing required sheets. Excel must contain: praktikum, mata_kuliah, asprak, jadwal, asprak_praktikum',
        },
        { status: 400 }
      );
    }

    const praktikumData = XLSX.utils.sheet_to_json<any>(sheets.praktikum);
    const mkData = XLSX.utils.sheet_to_json<any>(sheets.mk);
    const asprakData = XLSX.utils.sheet_to_json<any>(sheets.asprak);
    const jadwalData = XLSX.utils.sheet_to_json<any>(sheets.jadwal);
    const pivotData = XLSX.utils.sheet_to_json<any>(sheets.pivot);

    const insertedPraktikumIds: string[] = [];
    const insertedMkIds: string[] = [];
    const insertedAsprakIds: string[] = [];
    const insertedPivotIds: number[] = [];
    const insertedJadwalIds: number[] = [];

    try {
      const praktikumMap = new Map<string, string>();
      for (const row of praktikumData) {
        const name = row.nama_singkat || row.nama;
        const ta = row.tahun_ajaran || term;

        if (!ta) throw new Error(`Tahun Ajaran missing for ${name}`);

        const { data: existing } = await supabase
          .from('Praktikum')
          .select('id')
          .eq('nama', name)
          .eq('tahun_ajaran', ta)
          .maybeSingle();
        if (existing) {
          praktikumMap.set(name, existing.id);
        } else {
          const { data: inserted, error } = await supabase
            .from('Praktikum')
            .insert({ nama: name, tahun_ajaran: ta })
            .select('id')
            .single();
          if (error) throw new Error(`Failed to insert Praktikum ${name}: ${error.message}`);
          insertedPraktikumIds.push(inserted.id);
          praktikumMap.set(name, inserted.id);
        }
      }

      const mkMap = new Map<string, string>();
      for (const row of mkData) {
        const pId = praktikumMap.get(row.mk_singkat);
        if (!pId) continue;

        const { data: existing } = await supabase
          .from('Mata_Kuliah')
          .select('id')
          .eq('id_praktikum', pId)
          .eq('program_studi', row.program_studi)
          .maybeSingle();

        if (existing) {
          mkMap.set(`${row.mk_singkat}|${row.program_studi}`, existing.id);
        } else {
          const { data: inserted, error } = await supabase
            .from('Mata_Kuliah')
            .insert({
              id_praktikum: pId,
              nama_lengkap: row.nama_lengkap,
              program_studi: row.program_studi,
              dosen_koor: row.dosen_koor,
            })
            .select('id')
            .single();
          if (error) throw new Error(`Failed to insert MK: ${error.message}`);
          insertedMkIds.push(inserted.id);
          mkMap.set(`${row.mk_singkat}|${row.program_studi}`, inserted.id);
        }
      }

      const asprakCodeMap = new Map<string, string>();

      for (const row of asprakData) {
        let angkatan = parseInt(row.angkatan);
        if (angkatan < 100) angkatan += 2000;

        const { data: existingCodeOwner } = await supabase
          .from('Asprak')
          .select('*')
          .eq('kode', row.kode)
          .maybeSingle();

        const conflictCheck = checkCodeConflict(existingCodeOwner, row.nim.toString());
        if (conflictCheck.hasConflict && conflictCheck.existingOwner) {
          if (skipConflicts) {
            logger.warn(`Skipping Asprak ${row.nama_lengkap} due to conflict`);
            continue;
          } else {
            throw new Error(generateConflictErrorMessage(row.kode, conflictCheck.existingOwner));
          }
        }

        const { data: existingUser } = await supabase
          .from('Asprak')
          .select('id')
          .eq('nim', row.nim)
          .maybeSingle();

        if (existingUser) {
          await supabase
            .from('Asprak')
            .update({
              kode: row.kode,
              angkatan: angkatan,
              nama_lengkap: row.nama_lengkap,
            })
            .eq('id', existingUser.id);
          asprakCodeMap.set(row.kode, existingUser.id);
        } else {
          if (existingCodeOwner && existingCodeOwner.nim !== row.nim.toString()) {
            const expiredCode = generateExpiredCode(existingCodeOwner.kode, existingCodeOwner.id);
            await supabase
              .from('Asprak')
              .update({
                kode: expiredCode,
              })
              .eq('id', existingCodeOwner.id);
          }

          const { data: inserted, error } = await supabase
            .from('Asprak')
            .insert({
              nim: row.nim,
              nama_lengkap: row.nama_lengkap,
              kode: row.kode,
              angkatan: angkatan,
            })
            .select('id')
            .single();

          if (error) throw new Error(`Failed to insert Asprak: ${error.message}`);
          insertedAsprakIds.push(inserted.id);
          asprakCodeMap.set(row.kode, inserted.id);
        }
      }

      for (const row of pivotData) {
        const aId = asprakCodeMap.get(row.kode_asprak);
        const pId = praktikumMap.get(row.mk_singkat);
        if (aId && pId) {
          const { data: existing } = await supabase
            .from('Asprak_Praktikum')
            .select('id')
            .eq('id_asprak', aId)
            .eq('id_praktikum', pId)
            .maybeSingle();
          if (!existing) {
            const { data: inserted, error } = await supabase
              .from('Asprak_Praktikum')
              .insert({ id_asprak: aId, id_praktikum: pId })
              .select('id')
              .single();
            if (error) throw new Error(`Failed to link: ${error.message}`);
            insertedPivotIds.push(inserted.id);
          }
        }
      }

      let jadwalInserted = 0;
      for (const row of jadwalData) {
        const prodi = row.kelas.split('-')[0];
        let mkId =
          mkMap.get(`${row.nama_singkat}|${prodi}`) ||
          mkMap.get(`${row.nama_singkat}|IF`) ||
          mkMap.get(`${row.nama_singkat}|SE`);

        if (mkId) {
          const hariUpper = row.hari?.toString().toUpperCase().trim();
          let ruangan = row.ruangan?.toString().trim();
          if (ruangan?.includes('&')) ruangan = ruangan.split('&')[0].trim();

          const { data: inserted, error } = await supabase
            .from('Jadwal')
            .insert({
              id_mk: mkId,
              kelas: row.kelas,
              hari: hariUpper,
              sesi: row.sesi,
              jam: row.jam || '00:00:00',
              ruangan,
              total_asprak: row.total_asprak,
              dosen: row.dosen,
            })
            .select('id')
            .single();

          if (error) throw new Error(`Jadwal Error: ${error.message}`);
          insertedJadwalIds.push(inserted.id);
          jadwalInserted++;
        }
      }

      logger.info(`Import complete: ${jadwalInserted} jadwal inserted`);
      return NextResponse.json({ success: true, message: `Imported ${jadwalInserted} schedules` });
    } catch (e: any) {
      logger.error('Import failed, rolling back...', e);

      if (insertedJadwalIds.length > 0)
        await supabase.from('Jadwal').delete().in('id', insertedJadwalIds);
      if (insertedPivotIds.length > 0)
        await supabase.from('Asprak_Praktikum').delete().in('id', insertedPivotIds);
      if (insertedAsprakIds.length > 0)
        await supabase.from('Asprak').delete().in('id', insertedAsprakIds);
      if (insertedMkIds.length > 0)
        await supabase.from('Mata_Kuliah').delete().in('id', insertedMkIds);
      if (insertedPraktikumIds.length > 0)
        await supabase.from('Praktikum').delete().in('id', insertedPraktikumIds);

      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
