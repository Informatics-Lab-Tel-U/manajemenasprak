import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
// Use server-side admin client to ensure API routes can access data when RLS is enabled
const globalAdmin = createAdminClient();
import { Jadwal, JadwalPengganti } from '@/types/database';
import { logger } from '@/lib/logger';

export async function getAvailableTerms(supabaseClient?: SupabaseClient): Promise<string[]> {
  const supabase = supabaseClient || globalAdmin;
  const { data, error } = await supabase
    .from('praktikum')
    .select('tahun_ajaran')
    .order('tahun_ajaran', { ascending: false });

  if (!data) return [];
  return Array.from(new Set(data.map((p) => p.tahun_ajaran)))
    .sort()
    .reverse();
}

export async function getJadwalByTerm(
  term: string,
  supabaseClient?: SupabaseClient
): Promise<Jadwal[]> {
  const supabase = supabaseClient || globalAdmin;
  const { data, error } = await supabase
    .from('jadwal')
    .select(
      `
      *,
      mata_kuliah:mata_kuliah!inner (
        nama_lengkap,
        program_studi,
        praktikum:praktikum!inner (
          tahun_ajaran,
          nama
        )
      )
    `
    )
    .eq('mata_kuliah.praktikum.tahun_ajaran', term)
    .order('hari', { ascending: true })
    .order('jam', { ascending: true });

  if (error) {
    logger.error('Error fetching jadwal:', error);
    return [];
  }
  return data as Jadwal[];
}

export async function getScheduleForValidation(term: string, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || globalAdmin;
  const { data, error } = await supabase
    .from('jadwal')
    .select(
      `
      id, id_mk, kelas, hari, sesi, jam, ruangan,
      mata_kuliah:mata_kuliah!inner (
        praktikum:praktikum!inner (
          tahun_ajaran
        )
      )
    `
    )
    .eq('mata_kuliah.praktikum.tahun_ajaran', term);

  if (error) {
    logger.error('Error fetching schedule for validation:', error);
    return [];
  }
  return data;
}

export async function getTodaySchedule(
  limit: number = 5,
  term?: string,
  supabaseClient?: SupabaseClient
): Promise<Jadwal[]> {
  const supabase = supabaseClient || globalAdmin;
  const dayIndex = new Date().getDay();
  const weekdays = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

  if (dayIndex === 0) {
    return [];
  }

  const today = weekdays[dayIndex - 1];

  let query = supabase
    .from('jadwal')
    .select(
      `
      *,
      mata_kuliah:mata_kuliah!inner (
        nama_lengkap,
        program_studi,
        praktikum:praktikum!inner (
          tahun_ajaran,
          nama
        )
      )
    `
    )
    .eq('hari', today)
    .order('jam', { ascending: true })
    .limit(limit);

  if (term) {
    query = query.eq('mata_kuliah.praktikum.tahun_ajaran', term);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching today schedule:', error);
    return [];
  }
  return data as Jadwal[];
}

export interface CreateJadwalInput {
  id_mk: string;
  kelas: string;
  hari: string;
  sesi: number;
  jam: string;
  ruangan?: string;
  total_asprak?: number;
  dosen?: string;
}

export async function createJadwal(
  input: CreateJadwalInput,
  supabaseClient?: SupabaseClient
): Promise<Jadwal> {
  const supabase = supabaseClient || globalAdmin;
  const { id_mk, kelas, hari, sesi, jam, ruangan, total_asprak, dosen } = input;
  const cleanInput = { id_mk, kelas, hari, sesi, jam, ruangan, total_asprak, dosen };
  const { data, error } = await supabase.from('jadwal').insert(cleanInput).select().single();

  if (error) {
    logger.error('Error creating jadwal:', error);
    throw new Error(`Failed to create Jadwal: ${error.message}`);
  }
  return data;
}

export async function bulkCreateJadwal(
  inputs: CreateJadwalInput[],
  supabaseClient?: SupabaseClient
): Promise<{ inserted: number; errors: string[] }> {
  const supabase = supabaseClient || globalAdmin;
  if (inputs.length === 0) return { inserted: 0, errors: [] };

  const { data, error } = await supabase.from('jadwal').insert(inputs).select();

  if (error) {
    logger.error('Error bulk creating jadwal:', error);
    throw new Error(`Failed to bulk create Jadwal: ${error.message}`);
  }

  return { inserted: data?.length || 0, errors: [] };
}

export interface UpdateJadwalInput {
  id: string;
  id_mk?: string;
  kelas?: string;
  hari?: string;
  sesi?: number;
  jam?: string;
  ruangan?: string;
  total_asprak?: number;
  dosen?: string;
}

export async function updateJadwal(
  input: UpdateJadwalInput,
  supabaseClient?: SupabaseClient
): Promise<Jadwal> {
  const supabase = supabaseClient || globalAdmin;
  const { id, id_mk, kelas, hari, sesi, jam, ruangan, total_asprak, dosen } = input;

  const updates: Record<string, any> = {};
  if (id_mk !== undefined) updates.id_mk = id_mk;
  if (kelas !== undefined) updates.kelas = kelas;
  if (hari !== undefined) updates.hari = hari;
  if (sesi !== undefined) updates.sesi = sesi;
  if (jam !== undefined) updates.jam = jam;
  if (ruangan !== undefined) updates.ruangan = ruangan;
  if (total_asprak !== undefined) updates.total_asprak = total_asprak;
  if (dosen !== undefined) updates.dosen = dosen;

  const { data, error } = await supabase
    .from('jadwal')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating jadwal:', error);
    throw new Error(`Failed to update Jadwal: ${error.message}`);
  }
  return data;
}

export async function deleteJadwal(id: string, supabaseClient?: SupabaseClient): Promise<void> {
  const supabase = supabaseClient || globalAdmin;
  const { error } = await supabase.from('jadwal').delete().eq('id', id);
  if (error) {
    logger.error('Error deleting jadwal:', error);
    throw new Error(`Failed to delete Jadwal: ${error.message}`);
  }
}

export async function deleteJadwalByIds(
  ids: string[],
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient || globalAdmin;
  if (ids.length === 0) return;
  const { error } = await supabase.from('jadwal').delete().in('id', ids);
  if (error) {
    logger.error('Error deleting jadwal:', error);
    throw new Error(`Failed to delete: ${error.message}`);
  }
}

export async function deleteJadwalByTerm(
  term: string,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient || globalAdmin;

  // 1. Get all MK IDs associated with the term
  const { data: mkData, error: mkError } = await supabase
    .from('mata_kuliah')
    .select('id, praktikum!inner(tahun_ajaran)')
    .eq('praktikum.tahun_ajaran', term);

  if (mkError) {
    logger.error('Error fetching MK for bulk delete:', mkError);
    throw new Error(`Failed to fetch dependencies for deletion: ${mkError.message}`);
  }

  const mkIds = mkData?.map((mk) => mk.id) || [];

  if (mkIds.length === 0) {
    // Nothing to delete for this term
    return;
  }

  // 2. Delete all jadwal items corresponding to those MK IDs
  const { error } = await supabase.from('jadwal').delete().in('id_mk', mkIds);

  if (error) {
    logger.error('Error deleting jadwal by term:', error);
    throw new Error(`Failed to bulk delete Jadwal: ${error.message}`);
  }
}

export interface CreateJadwalPenggantiInput {
  id_jadwal: number;
  modul: number;
  tanggal: string;
  hari: string;
  sesi: number;
  jam: string;
  ruangan: string;
}

export async function getAllJadwal(supabaseClient?: SupabaseClient): Promise<Jadwal[]> {
  const supabase = supabaseClient || globalAdmin;
  const { data, error } = await supabase
    .from('jadwal')
    .select(
      `
      *,
      mata_kuliah:mata_kuliah (
        nama_lengkap,
        program_studi
      )
      `
    )
    .order('hari', { ascending: true })
    .order('jam', { ascending: true });

  if (error) {
    logger.error('Error fetching all jadwal:', error);
    return [];
  }
  return data as Jadwal[];
}

export async function getJadwalPengganti(
  modul: number,
  supabaseClient?: SupabaseClient
): Promise<JadwalPengganti[]> {
  const supabase = supabaseClient || globalAdmin;
  if (modul <= 0) return [];

  const { data, error } = await supabase.from('jadwal_pengganti').select('*').eq('modul', modul);

  if (error) {
    logger.error('Error fetching jadwal pengganti:', error);
    return [];
  }
  return data as JadwalPengganti[];
}

export async function upsertJadwalPengganti(
  input: CreateJadwalPenggantiInput,
  supabaseClient?: SupabaseClient
): Promise<JadwalPengganti> {
  const supabase = supabaseClient || globalAdmin;
  const { id_jadwal, modul, tanggal, hari, sesi, jam, ruangan } = input;

  if (!tanggal) {
    throw new Error('Tanggal wajib diisi untuk jadwal pengganti');
  }

  const cleanInput = { id_jadwal, modul, tanggal, hari, sesi, jam, ruangan };

  const { data: existing } = await supabase
    .from('jadwal_pengganti')
    .select('id')
    .eq('id_jadwal', id_jadwal)
    .eq('modul', modul)
    .maybeSingle();

  const query = supabase.from('jadwal_pengganti');

  if (existing) {
    const { data, error } = await query.update(cleanInput).eq('id', existing.id).select().single();

    if (error) throw new Error(`Failed to update Jadwal Pengganti: ${error.message}`);
    return data;
  } else {
    const { data, error } = await query.insert(cleanInput).select().single();

    if (error) throw new Error(`Failed to create Jadwal Pengganti: ${error.message}`);
    return data;
  }
}
