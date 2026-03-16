import * as XLSX from 'xlsx';
import { supabase } from '@/services/supabase';
import { logger } from '@/lib/logger';
import { checkCodeConflict, generateConflictErrorMessage } from './conflict';
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

  const insertedIds = {
    praktikum: [] as string[],
    mata_kuliah: [] as string[],
    asprak: [] as string[],
    asprak_praktikum: [] as number[],
    jadwal: [] as number[],
  };

  const rollback = async () => {
    logger.warn('Import failed, rolling back changes...');
    try {
      if (insertedIds.jadwal.length > 0)
        await supabase.from('jadwal').delete().in('id', insertedIds.jadwal);
      if (insertedIds.asprak_praktikum.length > 0)
        await supabase.from('asprak_praktikum').delete().in('id', insertedIds.asprak_praktikum);
      if (insertedIds.asprak.length > 0)
        await supabase.from('asprak').delete().in('id', insertedIds.asprak);
      if (insertedIds.mata_kuliah.length > 0)
        await supabase.from('mata_kuliah').delete().in('id', insertedIds.mata_kuliah);
      if (insertedIds.praktikum.length > 0)
        await supabase.from('praktikum').delete().in('id', insertedIds.praktikum);
      logger.info('Rollback completed successfully');
    } catch (err) {
      logger.error('Rollback partially failed!', err);
    }
  };

  try {
    // 1. Bulk Praktikum
    const praktikumMap = new Map<string, string>(); // name -> id
    const uniquePraktikum = new Map<string, string>(); // name -> ta
    praktikumData.forEach((row: any) => {
      const name = row.nama_singkat || row.nama;
      const ta = row.tahun_ajaran || defaultTerm;
      if (name && ta) uniquePraktikum.set(name, ta);
    });

    for (const [name, ta] of uniquePraktikum.entries()) {
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
        insertedIds.praktikum.push(inserted.id);
        praktikumMap.set(name, inserted.id);
      }
    }

    // 2. Bulk Mata Kuliah
    const mkMap = new Map<string, string>(); // "name|prodi" -> id
    const mkToInsert: any[] = [];

    for (const row of mkData) {
      const pId = praktikumMap.get(row.mk_singkat);
      if (!pId) continue;

      const { data: existing } = await supabase
        .from('mata_kuliah')
        .select('id')
        .eq('id_praktikum', pId)
        .eq('program_studi', row.program_studi)
        .maybeSingle();

      if (existing) {
        mkMap.set(`${row.mk_singkat}|${row.program_studi}`, existing.id);
      } else {
        mkToInsert.push({
          id_praktikum: pId,
          nama_lengkap: row.nama_lengkap,
          program_studi: row.program_studi,
          dosen_koor: row.dosen_koor,
        });
        // We'll insert in bulk after this loop, but we need to track mapping.
        // Actually, for MK it's better to insert one by one or carefully map if using select() after bulk.
      }
    }

    if (mkToInsert.length > 0) {
      const { data: inserted, error } = await supabase
        .from('mata_kuliah')
        .insert(mkToInsert)
        .select();
      if (error) throw new Error(`Failed to insert Mata Kuliah in bulk: ${error.message}`);

      inserted.forEach((item) => {
        insertedIds.mata_kuliah.push(item.id);
        // Find which row this matches to rebuild mkMap
        const match = mkData.find(
          (m) => m.nama_lengkap === item.nama_lengkap && m.program_studi === item.program_studi
        );
        if (match) mkMap.set(`${match.mk_singkat}|${match.program_studi}`, item.id);
      });
    }

    // 3. Bulk Asprak
    const asprakCodeMap = new Map<string, string>(); // kode -> id
    const nims = asprakData.map((a: any) => a.nim.toString());
    const codes = asprakData.map((a: any) => a.kode);

    // Fetch existing by NIM or Code to handle updates/conflicts
    const { data: existingByNim } = await supabase.from('asprak').select('*').in('nim', nims);
    const { data: existingByCode } = await supabase.from('asprak').select('*').in('kode', codes);

    const asprakToInsert: any[] = [];
    const asprakToUpdate: any[] = [];

    for (const row of asprakData) {
      let angkatan = parseInt(row.angkatan);
      if (angkatan < 100) angkatan += 2000;

      const existingCodeOwner = existingByCode?.find((a) => a.kode === row.kode) || null;
      const conflictCheck = checkCodeConflict(existingCodeOwner, row.nim.toString());

      if (conflictCheck.hasConflict && conflictCheck.existingOwner) {
        if (options?.skipConflicts) continue;
        throw new Error(generateConflictErrorMessage(row.kode, conflictCheck.existingOwner));
      }

      const existingUser = existingByNim?.find((a) => a.nim === row.nim.toString());
      if (existingUser) {
        asprakToUpdate.push({
          id: existingUser.id,
          kode: row.kode,
          angkatan: angkatan,
          nama_lengkap: row.nama_lengkap,
        });
        asprakCodeMap.set(row.kode, existingUser.id);
      } else {
        asprakToInsert.push({
          nim: row.nim.toString(),
          nama_lengkap: row.nama_lengkap,
          kode: row.kode,
          angkatan: angkatan,
        });
      }
    }

    // Handle updates (sequential but we can at least bulk them if it was upsert)
    // Supabase upsert on NIM is ideal here
    if (asprakToUpdate.length > 0 || asprakToInsert.length > 0) {
      const allAsprak = [...asprakToUpdate, ...asprakToInsert];
      // Supabase supports bulk upsert
      const { data: inserted, error } = await supabase
        .from('asprak')
        .upsert(allAsprak, { onConflict: 'nim' })
        .select();

      if (error) throw new Error(`Failed to upsert Asprak: ${error.message}`);

      inserted.forEach((item) => {
        // Track only if it was a new insert (based on our logic, it's hard to tell from upsert result alone
        // without comparing with existingByNim, but for rollback we only want to delete what WE added)
        const wasNew = !existingByNim?.some((e) => e.id === item.id);
        if (wasNew) insertedIds.asprak.push(item.id);
        asprakCodeMap.set(item.kode, item.id);
      });
    }

    // 4. Bulk Pivot
    const pivotToInsert: any[] = [];
    for (const row of pivotData) {
      const aId = asprakCodeMap.get(row.kode_asprak);
      const pId = praktikumMap.get(row.mk_singkat);
      if (aId && pId) {
        pivotToInsert.push({ id_asprak: aId, id_praktikum: pId });
      }
    }
    if (pivotToInsert.length > 0) {
      const { data: inserted, error } = await supabase
        .from('asprak_praktikum')
        .upsert(pivotToInsert, { onConflict: 'id_asprak,id_praktikum' })
        .select();
      if (error) throw new Error(`Failed to bulk insert Pivot: ${error.message}`);
      inserted.forEach((item) => insertedIds.asprak_praktikum.push(item.id));
    }

    // 5. Bulk Jadwal
    const jadwalToInsert: any[] = [];
    for (const row of jadwalData) {
      const prodi = row.kelas.toString().split('-')[0];
      let mkId = mkMap.get(`${row.nama_singkat}|${prodi}`);

      if (!mkId && row.kelas.toString().toUpperCase().includes('PJJ'))
        mkId = mkMap.get(`${row.nama_singkat}|IF-PJJ`);
      if (!mkId) {
        mkId =
          mkMap.get(`${row.nama_singkat}|IF`) ||
          mkMap.get(`${row.nama_singkat}|SE`) ||
          mkMap.get(`${row.nama_singkat}|IT`) ||
          mkMap.get(`${row.nama_singkat}|DS`);
      }

      if (mkId) {
        const hariUpper = row.hari ? row.hari.toString().toUpperCase().trim() : null;
        const ruanganTrimmed = row.ruangan ? row.ruangan.toString().trim() : null;
        if (!hariUpper) throw new Error(`Row ${row.kelas} is missing Hari.`);

        let validRuangan = ruanganTrimmed;
        if (ruanganTrimmed && ruanganTrimmed.includes('&')) {
          validRuangan = ruanganTrimmed.split('&')[0].trim();
        }

        jadwalToInsert.push({
          id_mk: mkId,
          kelas: row.kelas,
          hari: hariUpper,
          sesi: row.sesi,
          jam: row.jam || '00:00:00',
          ruangan: validRuangan,
          total_asprak: row.total_asprak,
          dosen: row.dosen,
        });
      } else {
        throw new Error(
          `Integrity Error: MK ID not found for Jadwal '${row.nama_singkat}' (${prodi})`
        );
      }
    }

    if (jadwalToInsert.length > 0) {
      const { data: inserted, error } = await supabase
        .from('jadwal')
        .insert(jadwalToInsert)
        .select();
      if (error) throw new Error(`Failed to bulk insert Jadwal: ${error.message}`);
      inserted.forEach((item) => insertedIds.jadwal.push(item.id));
    }

    logger.info(`Import success: ${jadwalToInsert.length} schedules.`);
    return { success: true, message: `Berhasil import ${jadwalToInsert.length} jadwal.` };
  } catch (e: any) {
    await rollback();
    throw e;
  }
}
