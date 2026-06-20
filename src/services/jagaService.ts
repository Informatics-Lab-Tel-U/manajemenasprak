import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { JadwalJaga } from '@/types/database';
import { createAuditLog } from './auditLogService';

export async function getJadwalJaga(
  term: string,
  modul?: number,
  hari?: string,
  supabaseClient?: SupabaseClient
): Promise<JadwalJaga[]> {
  const supabase = supabaseClient ?? await createClient();

  let query = supabase
    .from('jadwal_jaga')
    .select(`
      *,
      asprak:asprak(nama_lengkap, nim, kode, role)
    `)
    .eq('tahun_ajaran', term);

  if (typeof modul === 'number' && modul !== 0) {
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
  const supabase = supabaseClient ?? await createClient();

  const { data: created, error } = await supabase.from('jadwal_jaga').insert(input).select().single();

  if (error) {
    logger.error('Error inserting jadwal_jaga:', error);
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
  const supabase = supabaseClient ?? await createClient();

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
  const supabase = supabaseClient ?? await createClient();

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

export async function bulkUpsertJadwalJaga(
  id_asprak: string,
  tahun_ajaran: string,
  moduls: number[],
  hari: string,
  shift: number,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient ?? await createClient();

  const payloads = moduls.map((modul) => ({
    id_asprak,
    tahun_ajaran,
    modul,
    hari,
    shift,
  }));

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
        operation: 'INSERT',
        new_values: item,
      });
    }
  }
}

export async function bulkDeleteJadwalJaga(
  id_asprak: string,
  tahun_ajaran: string,
  moduls: number[],
  hari: string,
  shift: number,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient ?? await createClient();

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
  const supabase = supabaseClient ?? await createClient();

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
