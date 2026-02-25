import * as XLSX from 'xlsx';
import { supabase } from '@/services/supabase';
import { logger } from '@/lib/logger';
import { checkCodeConflict, generateConflictErrorMessage, generateExpiredCode } from './conflict';
import { isAsprakInactive } from './asprak';

export async function processExcelUpload(
  file: File,
  defaultTerm: string = '',
  options?: { skipConflicts?: boolean }
) {
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
    throw new Error(
      'Missing required sheets. Excel must contain: praktikum, mata_kuliah, asprak, jadwal, asprak_praktikum'
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
    const praktikumMap = new Map<string, string>(); // name -> id
    for (const row of praktikumData) {
      const name = row.nama_singkat || row.nama;
      const ta = row.tahun_ajaran || defaultTerm;

      if (!ta) throw new Error(`Tahun Ajaran missing for ${name} and no default term provided.`);

      const { data: existing } = await supabase
        .from('praktikum')
        .select('id')
        .eq('nama', name)
        .eq('tahun_ajaran', ta)
        .maybeSingle();
      if (existing) {
        praktikumMap.set(name, existing.id);
      } else {
        const { data: inserted, error } = await supabase
          .from('praktikum')
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

      if (!pId)
        throw new Error(
          `Integrity Error: Mata Kuliah '${row.mk_singkat}' references undefined Praktikum.`
        );

      const { data: existing } = await supabase
        .from('mata_kuliah')
        .select('id')
        .eq('id_praktikum', pId)
        .eq('program_studi', row.program_studi)
        .maybeSingle();

      if (existing) {
        mkMap.set(`${row.mk_singkat}|${row.program_studi}`, existing.id);
      } else {
        const { data: inserted, error } = await supabase
          .from('mata_kuliah')
          .insert({
            id_praktikum: pId,
            nama_lengkap: row.nama_lengkap,
            program_studi: row.program_studi,
            dosen_koor: row.dosen_koor,
          })
          .select('id')
          .single();
        if (error) throw new Error(`Failed to insert MK ${row.nama_lengkap}: ${error.message}`);
        insertedMkIds.push(inserted.id);
        mkMap.set(`${row.mk_singkat}|${row.program_studi}`, inserted.id);
      }
    }

    const asprakCodeMap = new Map<string, string>();

    for (const row of asprakData) {
      let angkatan = parseInt(row.angkatan);
      if (angkatan < 100) angkatan += 2000;

      const { data: existingCodeOwner } = await supabase
        .from('asprak')
        .select('*')
        .eq('kode', row.kode)
        .maybeSingle();

      const conflictCheck = checkCodeConflict(existingCodeOwner, row.nim.toString());
      if (conflictCheck.hasConflict && conflictCheck.existingOwner) {
        if (options?.skipConflicts) {
          logger.warn(
            `Skipping Asprak ${row.nama_lengkap} (${row.kode}) due to conflict with ${conflictCheck.existingOwner.nama_lengkap}.`
          );
          continue;
        } else {
          throw new Error(generateConflictErrorMessage(row.kode, conflictCheck.existingOwner));
        }
      }

      const { data: existingUser } = await supabase
        .from('asprak')
        .select('id')
        .eq('nim', row.nim)
        .maybeSingle();

      if (existingUser) {
        const { error } = await supabase
          .from('asprak')
          .update({
            kode: row.kode,
            angkatan: angkatan,
            nama_lengkap: row.nama_lengkap,
          })
          .eq('id', existingUser.id);
        if (error) throw new Error(`Failed to update Asprak ${row.nim}: ${error.message}`);
        asprakCodeMap.set(row.kode, existingUser.id);
      } else {
        if (existingCodeOwner && existingCodeOwner.nim !== row.nim.toString()) {
          const expiredCode = generateExpiredCode(existingCodeOwner.kode, existingCodeOwner.id);
          await supabase
            .from('asprak')
            .update({ kode: expiredCode })
            .eq('id', existingCodeOwner.id);
        }

        const { data: inserted, error } = await supabase
          .from('asprak')
          .insert({
            nim: row.nim,
            nama_lengkap: row.nama_lengkap,
            kode: row.kode,
            angkatan: angkatan,
          })
          .select('id')
          .single();

        if (error) throw new Error(`Failed to insert Asprak ${row.nama_lengkap}: ${error.message}`);

        insertedAsprakIds.push(inserted.id);
        asprakCodeMap.set(row.kode, inserted.id);
      }
    }

    for (const row of pivotData) {
      const aId = asprakCodeMap.get(row.kode_asprak);
      const pId = praktikumMap.get(row.mk_singkat);
      if (aId && pId) {
        const { data: existing } = await supabase
          .from('asprak_praktikum')
          .select('id')
          .eq('id_asprak', aId)
          .eq('id_praktikum', pId)
          .maybeSingle();
        if (!existing) {
          const { data: inserted, error } = await supabase
            .from('asprak_praktikum')
            .insert({ id_asprak: aId, id_praktikum: pId })
            .select('id')
            .single();
          if (error) throw new Error(`Failed to link Asprak-Praktikum: ${error.message}`);
          insertedPivotIds.push(inserted.id);
        }
      }
    }

    let jadwalInserted = 0;
    for (const row of jadwalData) {
      let prodi = row.kelas.split('-')[0];
      let mkId = mkMap.get(`${row.nama_singkat}|${prodi}`);

      if (!mkId && row.kelas.toString().toUpperCase().includes('PJJ'))
        mkId = mkMap.get(`${row.nama_singkat}|IF-PJJ`);
      if (!mkId)
        mkId =
          mkMap.get(`${row.nama_singkat}|IF`) ||
          mkMap.get(`${row.nama_singkat}|SE`) ||
          mkMap.get(`${row.nama_singkat}|IT`) ||
          mkMap.get(`${row.nama_singkat}|DS`);

      if (mkId) {
        const hariUpper = row.hari ? row.hari.toString().toUpperCase().trim() : null;
        const ruanganTrimmed = row.ruangan ? row.ruangan.toString().trim() : null;
        if (!hariUpper) throw new Error(`Row ${row.kelas} is missing Hari.`);

        let validRuangan = ruanganTrimmed;
        if (ruanganTrimmed && ruanganTrimmed.includes('&')) {
          validRuangan = ruanganTrimmed.split('&')[0].trim();
        }

        const { data: inserted, error } = await supabase
          .from('jadwal')
          .insert({
            id_mk: mkId,
            kelas: row.kelas,
            hari: hariUpper,
            sesi: row.sesi,
            jam: row.jam || '00:00:00',
            ruangan: validRuangan,
            total_asprak: row.total_asprak,
            dosen: row.dosen,
          })
          .select('id')
          .single();

        if (error) throw new Error(`Jadwal Insert Error for ${row.kelas}: ${error.message}`);
        insertedJadwalIds.push(inserted.id);
        jadwalInserted++;
      } else {
        throw new Error(
          `Data Integrity Error: Mata Kuliah ID not found for Jadwal row '${row.nama_singkat}' (Prodi: ${prodi})`
        );
      }
    }

    logger.info(`Summary: Inserted ${jadwalInserted} / ${jadwalData.length} Jadwal items.`);
    return { success: true, message: `Import completed! Inserted ${jadwalInserted} schedules.` };
  } catch (e: any) {
    logger.error('Import failed, rolling back...', e);

    if (insertedJadwalIds.length > 0)
      await supabase.from('jadwal').delete().in('id', insertedJadwalIds);

    if (insertedPivotIds.length > 0)
      await supabase.from('asprak_praktikum').delete().in('id', insertedPivotIds);

    if (insertedAsprakIds.length > 0)
      await supabase.from('asprak').delete().in('id', insertedAsprakIds);

    if (insertedMkIds.length > 0)
      await supabase.from('mata_kuliah').delete().in('id', insertedMkIds);

    if (insertedPraktikumIds.length > 0)
      await supabase.from('praktikum').delete().in('id', insertedPraktikumIds);

    throw new Error(`Import FAILED & ROLLED BACK: ${e.message}`);
  }
}
