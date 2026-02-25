import { createAdminClient } from '@/lib/supabase/admin';
import { Praktikum, MataKuliah } from '@/types/database';
import { logger } from '@/lib/logger';

// Admin Supabase client (bypasses RLS). This service is only used from API routes/server.
const supabase = createAdminClient();

export interface PraktikumWithStats extends Praktikum {
  asprak_count: number;
}

export interface PraktikumDetails {
  total_kelas: number;
  classes: {
    kelas: string;
    jadwal: {
      hari: string;
      jam: string;
      ruangan: string;
    }[];
  }[];
}

export async function getAllPraktikum(): Promise<Praktikum[]> {
  const { data, error } = await supabase.from('praktikum').select('*').order('nama');

  if (error) {
    logger.error('Error fetching praktikum:', error);
    return [];
  }
  return data as Praktikum[];
}

export async function getUniquePraktikumNames(): Promise<{ id: string; nama: string }[]> {
  const { data } = await supabase.from('praktikum').select('id, nama, tahun_ajaran').order('nama');
  if (!data) return [];

  const unique = Array.from(new Set(data.map((p) => p.nama))).map((name) => ({
    id: name,
    nama: name,
  }));
  return unique;
}

export async function getPraktikumByTerm(term?: string): Promise<PraktikumWithStats[]> {
  let query = supabase
    .from('praktikum')
    .select('*, asprak_praktikum(count)')
    .order('nama');

  if (term && term !== 'all') {
    query = query.eq('tahun_ajaran', term);
  }

  const { data, error } = await query;

  if (error) {
    logger.error(`Error fetching praktikum for term ${term}:`, error);
    return [];
  }
  
  // Transform data to flatten count
  return (data || []).map((item: any) => ({
    ...item,
    asprak_count: item.asprak_praktikum?.[0]?.count || 0
  })) as PraktikumWithStats[];
}

export async function getPraktikumDetails(praktikumId: string): Promise<PraktikumDetails> {
  // Query Mata_Kuliah related to praktikumId
  const { data: mks, error: mkError } = await supabase
    .from('mata_kuliah')
    .select('id')
    .eq('id_praktikum', praktikumId);
    
  if (mkError || !mks || mks.length === 0) {
      return { total_kelas: 0, classes: [] };
  }
  
  const mkIds = mks.map(m => m.id);
  
  // Query Jadwal related to mkIds
  const { data: jadwals, error: jadwalError } = await supabase
    .from('jadwal')
    .select('kelas, hari, jam, ruangan')
    .in('id_mk', mkIds)
    .order('kelas');
    
  if (jadwalError || !jadwals) {
      return { total_kelas: 0, classes: [] };
  }
  
  // Group by Kelas
  const grouped: Record<string, any[]> = {};
  jadwals.forEach(j => {
      if (!grouped[j.kelas]) grouped[j.kelas] = [];
      grouped[j.kelas].push({ hari: j.hari, jam: j.jam, ruangan: j.ruangan });
  });
  
  const classes = Object.keys(grouped).map(kelas => ({
      kelas,
      jadwal: grouped[kelas]
  }));
  
  return {
      total_kelas: classes.length,
      classes
  };
}

export async function getOrCreatePraktikum(nama: string, tahunAjaran: string): Promise<Praktikum> {
  const { data: existing } = await supabase
    .from('praktikum')
    .select('*')
    .eq('nama', nama)
    .eq('tahun_ajaran', tahunAjaran)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('praktikum')
    .insert({ nama, tahun_ajaran: tahunAjaran })
    .select()
    .single();

  if (error) {
    logger.error('Error creating praktikum:', error);
    throw new Error(`Failed to create Praktikum: ${error.message}`);
  }
  return data;
}

export async function getAllMataKuliah(): Promise<MataKuliah[]> {
  const { data, error } = await supabase
    .from('mata_kuliah')
    .select('*, praktikum:praktikum(nama, tahun_ajaran)')
    .order('nama_lengkap');

  if (error) {
    logger.error('Error fetching mata kuliah:', error);
    return [];
  }
  return data as MataKuliah[];
}

export interface CreateMataKuliahInput {
  id_praktikum: string;
  nama_lengkap: string;
  program_studi: string;
  dosen_koor?: string;
}

export async function createMataKuliah(input: CreateMataKuliahInput): Promise<MataKuliah> {
  const { data, error } = await supabase.from('mata_kuliah').insert(input).select().single();

  if (error) {
    logger.error('Error creating mata kuliah:', error);
    throw new Error(`Failed to create MK: ${error.message}`);
  }
  return data;
}

export async function deletePraktikumByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await supabase.from('praktikum').delete().in('id', ids);
}

export async function deleteMataKuliahByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await supabase.from('mata_kuliah').delete().in('id', ids);
}

export async function deleteAsprakPraktikumByIds(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await supabase.from('asprak_praktikum').delete().in('id', ids);
}

export interface BulkImportPraktikumResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

export async function bulkUpsertPraktikum(rows: { nama: string; tahun_ajaran: string }[]): Promise<BulkImportPraktikumResult> {
  const result: BulkImportPraktikumResult = { inserted: 0, skipped: 0, errors: [] };

  for (const row of rows) {
    try {
      const { data: existing } = await supabase
        .from('praktikum')
        .select('id')
        .eq('nama', row.nama)
        .eq('tahun_ajaran', row.tahun_ajaran)
        .maybeSingle();

      if (existing) {
        result.skipped++;
      } else {
        const { error } = await supabase
          .from('praktikum')
          .insert({ nama: row.nama, tahun_ajaran: row.tahun_ajaran });
        
        if (error) {
           result.errors.push(`Failed to insert ${row.nama}: ${error.message}`);
        } else {
           result.inserted++;
        }
      }
    } catch (e: any) {
      result.errors.push(`Error processing ${row.nama}: ${e.message}`);
    }
  }
  return result;
}
