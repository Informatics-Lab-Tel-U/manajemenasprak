import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Pelanggaran } from '@/types/database';
import type { CreatePelanggaranInput } from '@/types/api';
import { logger } from '@/lib/logger';

const globalAdmin = createAdminClient();

const PELANGGARAN_SELECT = `
  *,
  asprak:asprak (
    nama_lengkap,
    nim,
    kode
  ),
  jadwal:jadwal (
    hari,
    jam,
    kelas,
    mata_kuliah:mata_kuliah (
      id,
      nama_lengkap,
      program_studi
    )
  )
`;

/**
 * Fetch all pelanggaran (ADMIN / ASLAB — server-side via separate server service).
 * For the browser client (used in fetchers), scoped by RLS automatically.
 */
export async function getAllPelanggaran(supabaseClient?: SupabaseClient): Promise<Pelanggaran[]> {
  const supabase = supabaseClient || globalAdmin;
  const { data, error } = await supabase
    .from('pelanggaran')
    .select(PELANGGARAN_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching all pelanggaran:', error);
    return [];
  }
  return data as Pelanggaran[];
}

/**
 * Fetch pelanggaran scoped to the mata kuliah coordinated by a given user.
 * Used for ASPRAK_KOOR role — RLS enforces the actual restriction on Supabase side.
 */
export async function getPelanggaranByKoor(supabaseClient?: SupabaseClient): Promise<Pelanggaran[]> {
  const supabase = supabaseClient || globalAdmin;
  const { data, error } = await supabase
    .from('pelanggaran')
    .select(PELANGGARAN_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching pelanggaran by koor:', error);
    return [];
  }
  return data as Pelanggaran[];
}

/**
 * Fetch pelanggaran for a specific mata kuliah.
 */
export async function getPelanggaranByMataKuliah(idMk: string, supabaseClient?: SupabaseClient): Promise<Pelanggaran[]> {
  const supabase = supabaseClient || globalAdmin;
  const { data, error } = await supabase
    .from('pelanggaran')
    .select(PELANGGARAN_SELECT)
    .eq('jadwal.id_mk', idMk)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching pelanggaran by mata kuliah:', error);
    return [];
  }
  return data as Pelanggaran[];
}

/**
 * Create a new pelanggaran record.
 */
export async function createPelanggaran(input: CreatePelanggaranInput, supabaseClient?: SupabaseClient): Promise<Pelanggaran> {
  const supabase = supabaseClient || globalAdmin;
  const { data, error } = await supabase
    .from('pelanggaran')
    .insert(input)
    .select(PELANGGARAN_SELECT)
    .single();

  if (error) {
    logger.error('Error creating pelanggaran:', error);
    throw new Error(`Gagal mencatat pelanggaran: ${error.message}`);
  }
  return data as Pelanggaran;
}

/**
 * Finalize all pelanggaran for a specific mata kuliah.
 * Sets is_final = true for all non-final records in that mata kuliah.
 * Once finalized, records become read-only (enforced by RLS UPDATE policy).
 */
export async function finalizePelanggaranByMataKuliah(idMk: string, supabaseClient?: SupabaseClient): Promise<void> {
  const supabase = supabaseClient || globalAdmin;

  // Get all jadwal IDs for this mata kuliah
  const { data: jadwals, error: jadwalError } = await supabase
    .from('jadwal')
    .select('id')
    .eq('id_mk', idMk);

  if (jadwalError) throw new Error(`Gagal mengambil jadwal: ${jadwalError.message}`);

  const jadwalIds = jadwals.map((j: any) => j.id);
  if (jadwalIds.length === 0) return;

  const { error } = await supabase
    .from('pelanggaran')
    .update({
      is_final: true,
      finalized_at: new Date().toISOString(),
    })
    .in('id_jadwal', jadwalIds)
    .eq('is_final', false);

  if (error) {
    logger.error('Error finalizing pelanggaran:', error);
    throw new Error(`Gagal memfinalisasi pelanggaran: ${error.message}`);
  }
}

/**
 * Delete a pelanggaran record (only non-final, enforced by RLS).
 */
export async function deletePelanggaran(id: string, supabaseClient?: SupabaseClient): Promise<void> {
  const supabase = supabaseClient || globalAdmin;
  const { error } = await supabase.from('pelanggaran').delete().eq('id', id);

  if (error) {
    logger.error('Error deleting pelanggaran:', error);
    throw new Error(`Gagal menghapus pelanggaran: ${error.message}`);
  }
}
