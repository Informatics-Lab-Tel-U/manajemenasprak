import { supabase } from './supabase';
import { Jadwal } from '@/types/database';
import { logger } from '@/lib/logger';

export async function getAvailableTerms(): Promise<string[]> {
  const { data } = await supabase.from('Praktikum').select('tahun_ajaran');
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

export async function getTodaySchedule(limit: number = 5): Promise<Jadwal[]> {
  const dayIndex = new Date().getDay();
  const weekdays = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

  if (dayIndex === 0) {
    return [];
  }

  const today = weekdays[dayIndex - 1];

  const { data, error } = await supabase
    .from('Jadwal')
    .select(
      `
      *,
      mata_kuliah:Mata_Kuliah (
        nama_lengkap
      )
    `
    )
    .eq('hari', today)
    .order('jam', { ascending: true })
    .limit(limit);

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
  const { data, error } = await supabase.from('Jadwal').insert(input).select().single();

  if (error) {
    logger.error('Error creating jadwal:', error);
    throw new Error(`Failed to create Jadwal: ${error.message}`);
  }
  return data;
}

export async function deleteJadwalByIds(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from('Jadwal').delete().in('id', ids);
  if (error) {
    logger.error('Error deleting jadwal:', error);
    throw new Error(`Failed to delete: ${error.message}`);
  }
}
