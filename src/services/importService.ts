import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { checkCodeConflict, generateConflictErrorMessage } from '@/utils/conflict';

export async function processExcelImport(
  sheets: {
    praktikum: any;
    mk: any;
    asprak: any;
    jadwal: any;
    pivot: any;
  },
  term: string,
  skipConflicts: boolean,
  supabase: SupabaseClient
) {
  const praktikumData = sheets.praktikum;
  const mkData = sheets.mk;
  const asprakData = sheets.asprak;
  const jadwalData = sheets.jadwal;
  const pivotData = sheets.pivot;

  const insertedPraktikumIds: string[] = [];
  const insertedMkIds: string[] = [];
  const insertedAsprakIds: string[] = [];
  const insertedPivotIds: number[] = [];
  const insertedJadwalIds: number[] = [];

  try {
    const praktikumMap = new Map<string, string>();
    await Promise.all(
      praktikumData.map(async (row: any) => {
        const name = row.nama_singkat || row.nama;
        const ta = row.tahun_ajaran || term;

        if (!ta) throw new Error(`Tahun Ajaran missing for ${name}`);

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
      })
    );

    const mkMap = new Map<string, string>();
    await Promise.all(
      mkData.map(async (row: any) => {
        const pId = praktikumMap.get(row.mk_singkat);
        if (!pId) return;

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
          if (error) throw new Error(`Failed to insert MK: ${error.message}`);
          insertedMkIds.push(inserted.id);
          mkMap.set(`${row.mk_singkat}|${row.program_studi}`, inserted.id);
        }
      })
    );

    const asprakCodeMap = new Map<string, string>();

    await Promise.all(
      asprakData.map(async (row: any) => {
        let angkatan = parseInt(row.angkatan);
        if (angkatan < 100) angkatan += 2000;

        const { data: existingCodeOwner } = await supabase
          .from('asprak')
          .select('*')
          .eq('kode', row.kode)
          .maybeSingle();

        const conflictCheck = checkCodeConflict(existingCodeOwner, row.nim.toString());
        if (conflictCheck.hasConflict && conflictCheck.existingOwner) {
          if (skipConflicts) {
            logger.warn(`Skipping Asprak ${row.nama_lengkap} due to conflict`);
            return;
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
          await supabase
            .from('asprak')
            .update({
              kode: row.kode,
              angkatan: angkatan,
              nama_lengkap: row.nama_lengkap,
            })
            .eq('id', existingUser.id);
          asprakCodeMap.set(row.kode, existingUser.id);
        } else {
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

          if (error) throw new Error(`Failed to insert Asprak: ${error.message}`);
          insertedAsprakIds.push(inserted.id);
          asprakCodeMap.set(row.kode, inserted.id);
        }
      })
    );

    await Promise.all(
      pivotData.map(async (row: any) => {
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
            if (error) throw new Error(`Failed to link: ${error.message}`);
            insertedPivotIds.push(inserted.id);
          }
        }
      })
    );

    let jadwalInserted = 0;
    await Promise.all(
      jadwalData.map(async (row: any) => {
        const prodi = row.kelas.split('-')[0];
        const mkId =
          mkMap.get(`${row.nama_singkat}|${prodi}`) ||
          mkMap.get(`${row.nama_singkat}|IF`) ||
          mkMap.get(`${row.nama_singkat}|SE`);

        if (mkId) {
          const hariUpper = row.hari?.toString().toUpperCase().trim();
          let ruangan = row.ruangan?.toString().trim();
          if (ruangan?.includes('&')) ruangan = ruangan.split('&')[0].trim();

          const { data: inserted, error } = await supabase
            .from('jadwal')
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
      })
    );

    logger.info(`Import complete: ${jadwalInserted} jadwal inserted`);
    return { success: true, jadwalInserted };
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

    throw e;
  }
}
