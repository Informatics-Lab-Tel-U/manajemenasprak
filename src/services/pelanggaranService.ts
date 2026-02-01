import { supabase } from './supabase';
import { Pelanggaran } from '@/types/database';
import { logger } from '@/lib/logger';

export async function getAllPelanggaran(): Promise<Pelanggaran[]> {
  const { data, error } = await supabase
    .from('Pelanggaran')
    .select(
      `
      *,
      asprak:Asprak (
        nama_lengkap,
        nim,
        kode
      ),
      jadwal:Jadwal (
        hari,
        jam,
        kelas,
        mata_kuliah:Mata_Kuliah (
          nama_lengkap
        )
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching pelanggaran:', error);
    return [];
  }
  return data as Pelanggaran[];
}

export interface CreatePelanggaranInput {
  id_asprak: string;
  id_jadwal: number;
  jenis: string;
  modul?: string;
}

export async function createPelanggaran(input: CreatePelanggaranInput): Promise<Pelanggaran> {
  const { data, error } = await supabase.from('Pelanggaran').insert(input).select().single();

  if (error) {
    logger.error('Error creating pelanggaran:', error);
    throw new Error(`Failed to create Pelanggaran: ${error.message}`);
  }
  return data;
}

export async function deletePelanggaran(id: number): Promise<void> {
  const { error } = await supabase.from('Pelanggaran').delete().eq('id', id);

  if (error) {
    logger.error('Error deleting pelanggaran:', error);
    throw new Error(`Failed to delete Pelanggaran: ${error.message}`);
  }
}
