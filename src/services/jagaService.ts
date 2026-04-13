import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { JadwalJaga } from '@/types/database';
import { logger } from '@/lib/logger';
import { createAuditLog } from './auditLogService';

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

  const { data: created, error } = await supabase.from('jadwal_jaga').insert(input).select().single();

  if (error) {
    logger.error('Error inserting jadwal_jaga:', error);
    // Usually code 23505 is unique violation in Postgres
    if (error.code === '23505') {
      throw new Error(`Asisten ini sudah terdaftar pada shift tersebut.`);
    }
    throw new Error(`Gagal menambah jadwal jaga: ${error.message}`);
  }

  if (created) {
    await createAuditLog({
      table_name: 'jadwal_jaga',
      record_id: created.id,
      operation: 'INSERT',
      new_values: created,
    });
  }
}

export async function updateJadwalJaga(
  id: string,
  input: Partial<UpsertJadwalJagaInput>,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient || globalAdmin;

  // Get old data for audit
  const { data: oldData } = await supabase.from('jadwal_jaga').select('*').eq('id', id).single();

  const { data: updated, error } = await supabase
    .from('jadwal_jaga')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating jadwal_jaga:', error);
    throw new Error(`Gagal mengubah jadwal jaga: ${error.message}`);
  }

  if (updated && oldData) {
    await createAuditLog({
      table_name: 'jadwal_jaga',
      record_id: id,
      operation: 'UPDATE',
      old_values: oldData,
      new_values: updated,
    });
  }
}

export async function deleteJadwalJaga(
  id: string,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient || globalAdmin;

  // Get old data for audit
  const { data: oldData } = await supabase.from('jadwal_jaga').select('*').eq('id', id).single();

  const { error } = await supabase.from('jadwal_jaga').delete().eq('id', id);

  if (error) {
    logger.error('Error deleting jadwal_jaga:', error);
    throw new Error(`Gagal menghapus jadwal jaga: ${error.message}`);
  }

  if (oldData) {
    await createAuditLog({
      table_name: 'jadwal_jaga',
      record_id: id,
      operation: 'DELETE',
      old_values: oldData,
    });
  }
}

/**
 * Bulk create/upsert jaga to multiple modules
 */
export async function bulkUpsertJadwalJaga(
  id_asprak: string,
  tahun_ajaran: string,
  moduls: number[],
  hari: string,
  shift: number,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient || globalAdmin;

  const payloads = moduls.map((modul) => ({
    id_asprak,
    tahun_ajaran,
    modul,
    hari,
    shift,
  }));

  // We use upsert if we want to overwrite, but the user said "nginput langsung ke semua modul"
  // which implies adding if not exists. Usually we want to skip if already exists or overwrite.
  // Given the unique constraint, we'll try to insert and ignore/report errors?
  // Use upsert with onConflict on (id_asprak, tahun_ajaran, modul, hari, shift) if unique index exists.
  
  const { data: created, error } = await supabase
    .from('jadwal_jaga')
    .upsert(payloads, { onConflict: 'id_asprak, tahun_ajaran, modul, hari, shift' })
    .select();

  if (error) {
    logger.error('Error bulk upserting jadwal_jaga:', error);
    throw new Error(`Gagal bulk input jaga: ${error.message}`);
  }

  if (created && created.length > 0) {
    for (const item of created) {
      await createAuditLog({
        table_name: 'jadwal_jaga',
        record_id: item.id,
        operation: 'INSERT', // Actually UPSERT but logging as INSERT for simplicity unless changed
        new_values: item,
      });
    }
  }
}

/**
 * Bulk delete jaga for a specific assistant on a specific day/shift across selected modules
 */
export async function bulkDeleteJadwalJaga(
  id_asprak: string,
  tahun_ajaran: string,
  moduls: number[],
  hari: string,
  shift: number,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient || globalAdmin;

  const { data: toDelete, error: fetchError } = await supabase
    .from('jadwal_jaga')
    .select('*')
    .eq('id_asprak', id_asprak)
    .eq('tahun_ajaran', tahun_ajaran)
    .eq('hari', hari)
    .eq('shift', shift)
    .in('modul', moduls);

  if (fetchError) {
    logger.error('Error fetching for bulk delete:', fetchError);
    throw new Error(`Gagal bulk delete: ${fetchError.message}`);
  }

  if (!toDelete || toDelete.length === 0) return;

  const ids = toDelete.map((d) => d.id);
  const { error } = await supabase.from('jadwal_jaga').delete().in('id', ids);

  if (error) {
    logger.error('Error bulk deleting jadwal_jaga:', error);
    throw new Error(`Gagal bulk delete: ${error.message}`);
  }

  for (const item of toDelete) {
    await createAuditLog({
      table_name: 'jadwal_jaga',
      record_id: item.id,
      operation: 'DELETE',
      old_values: item,
    });
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
