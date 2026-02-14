import { supabase } from './supabase';
import { Praktikum, MataKuliah } from '@/types/database';
import { logger } from '@/lib/logger';

export async function getAllPraktikum(): Promise<Praktikum[]> {
  const { data, error } = await supabase.from('Praktikum').select('*').order('nama');

  if (error) {
    logger.error('Error fetching praktikum:', error);
    return [];
  }
  return data as Praktikum[];
}

export async function getUniquePraktikumNames(): Promise<{ id: string; nama: string }[]> {
  const { data } = await supabase.from('Praktikum').select('id, nama, tahun_ajaran').order('nama');
  if (!data) return [];

  const unique = Array.from(new Set(data.map((p) => p.nama))).map((name) => ({
    id: name,
    nama: name,
  }));
  return unique;
}

export async function getPraktikumByTerm(term: string): Promise<Praktikum[]> {
  const { data, error } = await supabase
    .from('Praktikum')
    .select('*')
    .eq('tahun_ajaran', term)
    .order('nama');

  if (error) {
    logger.error(`Error fetching praktikum for term ${term}:`, error);
    return [];
  }
  return data as Praktikum[];
}

export async function getOrCreatePraktikum(nama: string, tahunAjaran: string): Promise<Praktikum> {
  const { data: existing } = await supabase
    .from('Praktikum')
    .select('*')
    .eq('nama', nama)
    .eq('tahun_ajaran', tahunAjaran)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('Praktikum')
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
  const { data, error } = await supabase.from('Mata_Kuliah').select('*').order('nama_lengkap');

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
  const { data, error } = await supabase.from('Mata_Kuliah').insert(input).select().single();

  if (error) {
    logger.error('Error creating mata kuliah:', error);
    throw new Error(`Failed to create MK: ${error.message}`);
  }
  return data;
}

export async function deletePraktikumByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await supabase.from('Praktikum').delete().in('id', ids);
}

export async function deleteMataKuliahByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await supabase.from('Mata_Kuliah').delete().in('id', ids);
}

export async function deleteAsprakPraktikumByIds(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await supabase.from('Asprak_Praktikum').delete().in('id', ids);
}
