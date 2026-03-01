import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { Praktikum, MataKuliah } from '@/types/database';
import { logger } from '@/lib/logger';

// Admin Supabase client (bypasses RLS). This service is only used from API routes/server.
const globalAdmin = createAdminClient();

export interface PraktikumWithStats extends Praktikum {
  asprak_count: number;
}

export async function getPraktikumById(id: string, supabaseClient?: SupabaseClient): Promise<Praktikum | null> {
  const supabase = supabaseClient || globalAdmin;
  const { data, error } = await supabase.from('praktikum').select('*').eq('id', id).single();
  if (error) {
    if (error.code !== 'PGRST116') {
      logger.error(`Error fetching praktikum ${id}:`, error);
    }
    return null;
  }
  return data as Praktikum;
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

export async function getAllPraktikum(supabaseClient?: SupabaseClient): Promise<Praktikum[]> {
  const supabase = supabaseClient || globalAdmin;
  const { data, error } = await supabase.from('praktikum').select('*').order('nama');

  if (error) {
    logger.error('Error fetching praktikum:', error);
    return [];
  }
  return data as Praktikum[];
}

export async function getUniquePraktikumNames(supabaseClient?: SupabaseClient): Promise<{ id: string; nama: string }[]> {
  const supabase = supabaseClient || globalAdmin;
  const { data } = await supabase.from('praktikum').select('id, nama, tahun_ajaran').order('nama');
  if (!data) return [];

  const unique = Array.from(new Set(data.map((p) => p.nama))).map((name) => ({
    id: name,
    nama: name,
  }));
  return unique;
}

export async function getPraktikumByTerm(term?: string, supabaseClient?: SupabaseClient): Promise<PraktikumWithStats[]> {
  const supabase = supabaseClient || globalAdmin;
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
  

  return (data || []).map((item: any) => ({
    ...item,
    asprak_count: item.asprak_praktikum?.[0]?.count || 0
  })) as PraktikumWithStats[];
}

export async function getPraktikumDetails(praktikumId: string, supabaseClient?: SupabaseClient): Promise<PraktikumDetails> {
  const supabase = supabaseClient || globalAdmin;
  const { data: mks, error: mkError } = await supabase
    .from('mata_kuliah')
    .select('id')
    .eq('id_praktikum', praktikumId);
    
  if (mkError || !mks || mks.length === 0) {
      return { total_kelas: 0, classes: [] };
  }
  
  const mkIds = mks.map(m => m.id);
  
  const { data: jadwals, error: jadwalError } = await supabase
    .from('jadwal')
    .select('kelas, hari, jam, ruangan')
    .in('id_mk', mkIds)
    .order('kelas');
    
  if (jadwalError || !jadwals) {
      return { total_kelas: 0, classes: [] };
  }
  
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

export async function getOrCreatePraktikum(nama: string, tahunAjaran: string, supabaseClient?: SupabaseClient): Promise<Praktikum> {
  const supabase = supabaseClient || globalAdmin;
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

export async function getAllMataKuliah(supabaseClient?: SupabaseClient): Promise<MataKuliah[]> {
  const supabase = supabaseClient || globalAdmin;
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

export async function createMataKuliah(input: CreateMataKuliahInput, supabaseClient?: SupabaseClient): Promise<MataKuliah> {
  const supabase = supabaseClient || globalAdmin;
  const { data, error } = await supabase.from('mata_kuliah').insert(input).select().single();

  if (error) {
    logger.error('Error creating mata kuliah:', error);
    throw new Error(`Failed to create MK: ${error.message}`);
  }
  return data;
}

export async function deletePraktikumByIds(ids: string[], supabaseClient?: SupabaseClient): Promise<void> {
  const supabase = supabaseClient || globalAdmin;
  if (ids.length === 0) return;
  await supabase.from('praktikum').delete().in('id', ids);
}

export async function deleteMataKuliahByIds(ids: string[], supabaseClient?: SupabaseClient): Promise<void> {
  const supabase = supabaseClient || globalAdmin;
  if (ids.length === 0) return;
  await supabase.from('mata_kuliah').delete().in('id', ids);
}

export async function deleteAsprakPraktikumByIds(ids: number[], supabaseClient?: SupabaseClient): Promise<void> {
  const supabase = supabaseClient || globalAdmin;
  if (ids.length === 0) return;
  await supabase.from('asprak_praktikum').delete().in('id', ids);
}

export interface BulkImportPraktikumResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

export async function bulkUpsertPraktikum(rows: { nama: string; tahun_ajaran: string }[], supabaseClient?: SupabaseClient): Promise<BulkImportPraktikumResult> {
  const supabase = supabaseClient || globalAdmin;
  const result: BulkImportPraktikumResult = { inserted: 0, skipped: 0, errors: [] };

  if (rows.length === 0) return result;

  try {
    const terms = Array.from(new Set(rows.map(r => r.tahun_ajaran)));
    
    // Fetch existing entries to skip
    const { data: existing } = await supabase
      .from('praktikum')
      .select('nama, tahun_ajaran')
      .in('tahun_ajaran', terms);
      
    const existingSet = new Set((existing || []).map(e => `${e.nama}_${e.tahun_ajaran}`));
    
    // Filter duplicates against database
    const toInsert = rows.filter(r => !existingSet.has(`${r.nama}_${r.tahun_ajaran}`));
    result.skipped = rows.length - toInsert.length;

    if (toInsert.length > 0) {
      // Deduplicate payload internally
      const uniquePayload = [];
      const seen = new Set();
      for (const row of toInsert) {
        const key = `${row.nama}_${row.tahun_ajaran}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniquePayload.push(row);
        }
      }
      
      result.skipped += (toInsert.length - uniquePayload.length);

      const { data, error } = await supabase.from('praktikum').insert(uniquePayload).select();
      
      if (error) {
        result.errors.push(`Bulk insert err: ${error.message}`);
      } else {
        result.inserted = data?.length || 0;
      }
    }
  } catch (e: any) {
    result.errors.push(`Process err: ${e.message}`);
  }

  return result;
}

