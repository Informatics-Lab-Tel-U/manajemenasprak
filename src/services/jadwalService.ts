import { supabase } from './supabase';
import { Jadwal, JadwalPengganti } from '@/types/database';
import { logger } from '@/lib/logger';

export async function getAvailableTerms(): Promise<string[]> {
  const { data, error } = await supabase
    .from('Praktikum')
    .select('tahun_ajaran')
    .order('tahun_ajaran', { ascending: false });

  if (!data) return [];
  return Array.from(new Set(data.map((p) => p.tahun_ajaran)))
    .sort()
    .reverse();
}

export async function getJadwalByTerm(term: string): Promise<Jadwal[]> {
  const { data, error } = await supabase
    .from('Jadwal')
    .select(
      `
      *,
      mata_kuliah:Mata_Kuliah!inner (
        nama_lengkap,
        program_studi,
        praktikum:Praktikum!inner (
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

export async function getScheduleForValidation(term: string) {
  const { data, error } = await supabase
    .from('Jadwal')
    .select(`
      id, id_mk, kelas, hari, sesi, jam, ruangan,
      mata_kuliah:Mata_Kuliah!inner (
        praktikum:Praktikum!inner (
          tahun_ajaran
        )
      )
    `)
    .eq('mata_kuliah.praktikum.tahun_ajaran', term);

  if (error) {
    logger.error('Error fetching schedule for validation:', error);
    return [];
  }
  return data;
}

export async function getTodaySchedule(limit: number = 5, term?: string): Promise<Jadwal[]> {
  const dayIndex = new Date().getDay();
  const weekdays = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

  if (dayIndex === 0) {
    return [];
  }

  const today = weekdays[dayIndex - 1];

  let query = supabase
    .from('Jadwal')
    .select(
      `
      *,
      mata_kuliah:Mata_Kuliah!inner (
        nama_lengkap,
        program_studi,
        praktikum:Praktikum!inner (
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

export async function createJadwal(input: CreateJadwalInput): Promise<Jadwal> {
  const { id_mk, kelas, hari, sesi, jam, ruangan, total_asprak, dosen } = input;
  const cleanInput = { id_mk, kelas, hari, sesi, jam, ruangan, total_asprak, dosen };
  const { data, error } = await supabase.from('Jadwal').insert(cleanInput).select().single();

  if (error) {
    logger.error('Error creating jadwal:', error);
    throw new Error(`Failed to create Jadwal: ${error.message}`);
  }
  return data;
}

export async function bulkCreateJadwal(inputs: CreateJadwalInput[]): Promise<{ inserted: number; errors: string[] }> {
  if (inputs.length === 0) return { inserted: 0, errors: [] };

  const { data, error } = await supabase.from('Jadwal').insert(inputs).select();

  if (error) {
    logger.error('Error bulk creating jadwal:', error);
    throw new Error(`Failed to bulk create Jadwal: ${error.message}`);
  }

  return { inserted: data?.length || 0, errors: [] };
}


export interface UpdateJadwalInput {
  id: number;
  id_mk?: string;
  kelas?: string;
  hari?: string;
  sesi?: number;
  jam?: string;
  ruangan?: string;
  total_asprak?: number;
  dosen?: string;
}

export async function updateJadwal(input: UpdateJadwalInput): Promise<Jadwal> {
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
    .from('Jadwal')
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

export async function deleteJadwal(id: number): Promise<void> {
  const { error } = await supabase.from('Jadwal').delete().eq('id', id);
  if (error) {
    logger.error('Error deleting jadwal:', error);
    throw new Error(`Failed to delete Jadwal: ${error.message}`);
  }
}

export async function deleteJadwalByIds(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from('Jadwal').delete().in('id', ids);
  if (error) {
    logger.error('Error deleting jadwal:', error);
    throw new Error(`Failed to delete: ${error.message}`);
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

export async function getJadwalPengganti(modul: number): Promise<JadwalPengganti[]> {
  if (modul <= 0) return [];
  
  const { data, error } = await supabase
    .from('Jadwal_Pengganti')
    .select('*')
    .eq('modul', modul);

  if (error) {
    logger.error('Error fetching jadwal pengganti:', error);
    return [];
  }
  return data as JadwalPengganti[];
}

export async function upsertJadwalPengganti(input: CreateJadwalPenggantiInput): Promise<JadwalPengganti> {
  const { id_jadwal, modul, tanggal, hari, sesi, jam, ruangan } = input;
  
  if (!tanggal) {
      throw new Error('Tanggal wajib diisi untuk jadwal pengganti');
  }

  const cleanInput = { id_jadwal, modul, tanggal, hari, sesi, jam, ruangan };

  const { data: existing } = await supabase
    .from('Jadwal_Pengganti')
    .select('id')
    .eq('id_jadwal', id_jadwal)
    .eq('modul', modul)
    .maybeSingle();

  let query = supabase.from('Jadwal_Pengganti');
  
  if (existing) {
    const { data, error } = await query
      .update(cleanInput)
      .eq('id', existing.id)
      .select()
      .single();
      
    if (error) throw new Error(`Failed to update Jadwal Pengganti: ${error.message}`);
    return data;
  } else {
    const { data, error } = await query
      .insert(cleanInput)
      .select()
      .single();

    if (error) throw new Error(`Failed to create Jadwal Pengganti: ${error.message}`);
    return data;
  }
}
