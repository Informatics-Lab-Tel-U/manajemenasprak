import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

const globalAdmin = createAdminClient();

export type PraktikanId = string | number;

export type PraktikanRecord = {
  id: PraktikanId;
  created_at?: string;
  nama: string;
  kode_asprak: string | null;
  kelas: string;
  mata_kuliah: string;
};

export type PraktikanFilters = {
  kelas?: string;
  mata_kuliah?: string;
};

export type CreatePraktikanInput = {
  nama: string;
  kode_asprak?: string | null;
  kelas: string;
  mata_kuliah: string;
};

export type UpdatePraktikanInput = Partial<CreatePraktikanInput>;

export type CreatePraktikanResult = {
  inserted: number;
  data: PraktikanRecord[];
};

function getClient(supabaseClient?: SupabaseClient) {
  return supabaseClient ?? globalAdmin;
}

function normalizeRequired(value: unknown, field: string) {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();

  if (!normalized) {
    throw new Error(`${field} wajib diisi`);
  }

  return normalized;
}

function normalizeOptional(value: unknown) {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();

  return normalized || null;
}

function normalizeCreateInput(input: CreatePraktikanInput) {
  return {
    nama: normalizeRequired(input.nama, 'nama'),
    kelas: normalizeRequired(input.kelas, 'kelas'),
    mata_kuliah: normalizeRequired(input.mata_kuliah, 'mata_kuliah'),
    kode_asprak: normalizeOptional(input.kode_asprak),
  };
}

function normalizeUpdateInput(input: UpdatePraktikanInput) {
  const payload: Partial<CreatePraktikanInput> = {};

  if ('nama' in input) payload.nama = normalizeRequired(input.nama, 'nama');
  if ('kelas' in input) payload.kelas = normalizeRequired(input.kelas, 'kelas');
  if ('mata_kuliah' in input) {
    payload.mata_kuliah = normalizeRequired(input.mata_kuliah, 'mata_kuliah');
  }
  if ('kode_asprak' in input) payload.kode_asprak = normalizeOptional(input.kode_asprak);

  if (Object.keys(payload).length === 0) {
    throw new Error('Tidak ada data yang diperbarui');
  }

  return payload;
}

function validateId(id: unknown): PraktikanId {
  const normalized = String(id ?? '').trim();
  if (!normalized) throw new Error('id praktikan wajib diisi');
  return normalized;
}

export async function getPraktikanList(
  filters: PraktikanFilters = {},
  supabaseClient?: SupabaseClient
): Promise<PraktikanRecord[]> {
  const supabase = getClient(supabaseClient);

  let query = supabase
    .from('praktikan')
    .select('id, created_at, nama, kelas, kode_asprak, mata_kuliah')
    .order('kelas', { ascending: true })
    .order('nama', { ascending: true });

  if (filters.kelas) {
    query = query.eq('kelas', filters.kelas.trim().toUpperCase());
  }

  if (filters.mata_kuliah) {
    query = query.eq('mata_kuliah', filters.mata_kuliah.trim().toUpperCase());
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching praktikan data:', error);
    throw new Error(`Gagal mengambil data praktikan: ${error.message}`);
  }

  return (data ?? []) as PraktikanRecord[];
}

export async function createPraktikan(
  input: CreatePraktikanInput | CreatePraktikanInput[],
  supabaseClient?: SupabaseClient
): Promise<CreatePraktikanResult> {
  const supabase = getClient(supabaseClient);
  const rows = Array.isArray(input) ? input : [input];
  const payload = rows.map(normalizeCreateInput);

  if (payload.length === 0) {
    return { inserted: 0, data: [] };
  }

  const { data, error } = await supabase
    .from('praktikan')
    .insert(payload)
    .select('id, created_at, nama, kelas, kode_asprak, mata_kuliah');

  if (error) {
    logger.error('Error creating praktikan data:', error);
    throw new Error(`Gagal membuat data praktikan: ${error.message}`);
  }

  return {
    inserted: data?.length ?? 0,
    data: (data ?? []) as PraktikanRecord[],
  };
}

export async function updatePraktikan(
  id: PraktikanId,
  input: UpdatePraktikanInput,
  supabaseClient?: SupabaseClient
): Promise<PraktikanRecord> {
  const supabase = getClient(supabaseClient);
  const praktikanId = validateId(id);
  const payload = normalizeUpdateInput(input);

  const { data, error } = await supabase
    .from('praktikan')
    .update(payload)
    .eq('id', praktikanId)
    .select('id, created_at, nama, kelas, kode_asprak, mata_kuliah')
    .single();

  if (error) {
    logger.error(`Error updating praktikan ${praktikanId}:`, error);
    throw new Error(`Gagal memperbarui data praktikan: ${error.message}`);
  }

  return data as PraktikanRecord;
}

export async function deletePraktikan(
  id: PraktikanId,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = getClient(supabaseClient);
  const praktikanId = validateId(id);

  const { error } = await supabase.from('praktikan').delete().eq('id', praktikanId);

  if (error) {
    logger.error(`Error deleting praktikan ${praktikanId}:`, error);
    throw new Error(`Gagal menghapus data praktikan: ${error.message}`);
  }
}

export async function deletePraktikanByKelas(
  kelas: string,
  supabaseClient?: SupabaseClient
): Promise<{ deleted: number }> {
  const supabase = getClient(supabaseClient);
  const normalizedKelas = normalizeRequired(kelas, 'kelas');

  const { data, error } = await supabase
    .from('praktikan')
    .delete()
    .eq('kelas', normalizedKelas)
    .select('id');

  if (error) {
    logger.error(`Error deleting praktikan by kelas ${normalizedKelas}:`, error);
    throw new Error(`Gagal menghapus data praktikan berdasarkan kelas: ${error.message}`);
  }

  return { deleted: data?.length ?? 0 };
}
