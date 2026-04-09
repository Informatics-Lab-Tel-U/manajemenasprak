import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { JadwalJaga } from '@/types/database';
import { logger } from '@/lib/logger';

const globalAdmin = createAdminClient();

// Get list of Jadwal Jaga for a specific term, modul, and hari (or all hari if day is not provided)
export async function getJadwalJaga(
  term: string,
  modul?: number,
  hari?: string,
  supabaseClient?: SupabaseClient
): Promise<JadwalJaga[]> {
  const supabase = supabaseClient || globalAdmin;

  let query = supabase
    .from('jadwal_jaga')
    .select(`
      *,
      asprak:asprak(nama_lengkap, nim, kode, role)
    `)
    .eq('tahun_ajaran', term);

  if (modul) {
    query = query.eq('modul', modul);
  }

  if (hari) {
    query = query.eq('hari', hari);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching jadwal_jaga:', error);
    throw new Error(`Gagal mengambil data jaga: ${error.message}`);
  }

  return data as JadwalJaga[];
}

export interface UpsertJadwalJagaInput {
  id_asprak: string;
  tahun_ajaran: string;
  modul: number;
  hari: string;
  shift: number;
}

export async function upsertJadwalJaga(
  input: UpsertJadwalJagaInput,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient || globalAdmin;

  const { error } = await supabase.from('jadwal_jaga').insert(input);

  if (error) {
    logger.error('Error inserting jadwal_jaga:', error);
    // Usually code 23505 is unique violation in Postgres
    if (error.code === '23505') {
      throw new Error(`Asisten ini sudah terdaftar pada shift tersebut.`);
    }
    throw new Error(`Gagal menambah jadwal jaga: ${error.message}`);
  }
}

export async function deleteJadwalJaga(
  id: string,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient || globalAdmin;

  const { error } = await supabase.from('jadwal_jaga').delete().eq('id', id);

  if (error) {
    logger.error('Error deleting jadwal_jaga:', error);
    throw new Error(`Gagal menghapus jadwal jaga: ${error.message}`);
  }
}

export async function getRekapJagaAggregated(
  term: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || globalAdmin;

  // Fetch all jaga for the term
  const { data, error } = await supabase
    .from('jadwal_jaga')
    .select(`
      modul,
      id_asprak,
      asprak:asprak(kode, nama_lengkap, role)
    `)
    .eq('tahun_ajaran', term);

  if (error) {
    logger.error('Error fetching rekap_jaga:', error);
    throw new Error(`Gagal mengambil data rekap jaga: ${error.message}`);
  }

  return data;
}
