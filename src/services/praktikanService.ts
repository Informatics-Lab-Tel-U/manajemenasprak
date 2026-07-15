import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

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

export type PraktikanOptions = {
  kelas: string[];
  mata_kuliah: string[];
};

async function getClient(supabaseClient?: SupabaseClient) {
  return supabaseClient ?? (await createClient());
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

function getMataKuliahSearchAliases(value: unknown) {
  const normalized = normalizeRequired(value, 'mata_kuliah');
  const aliases = [
    normalized,
    normalized.replace(/[\s_]+/g, '-'),
    normalized.replace(/[-_]+/g, ' '),
    normalized.replace(/[\s_-]+/g, ''),
  ];

  return Array.from(new Set(aliases.filter(Boolean)));
}

function buildMataKuliahLikeFilter(value: unknown) {
  return getMataKuliahSearchAliases(value)
    .map((alias) => `mata_kuliah.ilike.%${alias}%`)
    .join(',');
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
  const supabase = await getClient(supabaseClient);

  let query = supabase
    .from('praktikan')
    .select('id, created_at, nama, kelas, kode_asprak, mata_kuliah')
    .order('kelas', { ascending: true })
    .order('nama', { ascending: true });

  if (filters.kelas) {
    query = query.eq('kelas', filters.kelas.trim().toUpperCase());
  }

  if (filters.mata_kuliah) {
    query = query.or(buildMataKuliahLikeFilter(filters.mata_kuliah));
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching praktikan data:', error);
    throw new Error(`Gagal mengambil data praktikan: ${error.message}`);
  }

  return (data ?? []) as PraktikanRecord[];
}

export function getActiveTahunAjaran(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startsCurrentYear = month >= 6;
  const start = startsCurrentYear ? year : year - 1;
  const end = startsCurrentYear ? year + 1 : year;
  const startYear = String(start).slice(-2).padStart(2, '0');
  const endYear = String(end).slice(-2).padStart(2, '0');
  const semester = month >= 1 && month <= 5 ? '2' : '1';

  return `${startYear}${endYear}-${semester}`;
}

export async function getActivePraktikumMataKuliahOptions(
  supabaseClient?: SupabaseClient
): Promise<string[]> {
  const supabase = await getClient(supabaseClient);
  const activeTahunAjaran = getActiveTahunAjaran();

  const { data, error } = await supabase
    .from('praktikum')
    .select('nama')
    .ilike('tahun_ajaran', `%${activeTahunAjaran}%`)
    .order('nama', { ascending: true });

  if (error) {
    logger.error(`Error fetching praktikum mata kuliah for ${activeTahunAjaran}:`, error);
    throw new Error(`Gagal mengambil mata kuliah praktikum: ${error.message}`);
  }

  const seen = new Set<string>();
  return (data ?? []).reduce((acc: string[], row: { nama?: string | null }) => {
    const nama = String(row.nama ?? '').trim().toUpperCase();
    if (nama && !seen.has(nama)) {
      seen.add(nama);
      acc.push(nama);
    }
    return acc;
  }, []);
}

export async function getPraktikanKelasByMataKuliah(
  mataKuliah: string | null | undefined,
  supabaseClient?: SupabaseClient
): Promise<string[]> {
  const supabase = await getClient(supabaseClient);

  let query = supabase.from('praktikan').select('kelas').order('kelas', { ascending: true });

  if (mataKuliah && mataKuliah.trim()) {
    query = query.or(buildMataKuliahLikeFilter(mataKuliah.trim()));
  }

  const { data, error } = await query;

  if (error) {
    logger.error(`Error fetching praktikan kelas for ${mataKuliah}:`, error);
    throw new Error(`Gagal mengambil kelas praktikan: ${error.message}`);
  }

  const seen = new Set<string>();
  return (data ?? []).reduce((acc: string[], row: { kelas?: string | null }) => {
    const kelas = String(row.kelas ?? '').trim().toUpperCase();
    if (kelas && !seen.has(kelas)) {
      seen.add(kelas);
      acc.push(kelas);
    }
    return acc;
  }, []);
}

export async function getPraktikanOptions(
  supabaseClient?: SupabaseClient
): Promise<PraktikanOptions> {
  const supabase = await getClient(supabaseClient);

  const { data, error } = await supabase.rpc('get_praktikan_options').single();

  if (error) {
    logger.error('Error fetching praktikan options:', error);
    throw new Error(`Gagal mengambil opsi data praktikan: ${error.message}`);
  }

  const options = data as PraktikanOptions | null;

  return {
    kelas: options?.kelas ?? [],
    mata_kuliah: options?.mata_kuliah ?? [],
  };
}

export async function createPraktikan(
  input: CreatePraktikanInput | CreatePraktikanInput[],
  supabaseClient?: SupabaseClient
): Promise<CreatePraktikanResult> {
  const supabase = await getClient(supabaseClient);
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
  const supabase = await getClient(supabaseClient);
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
  const supabase = await getClient(supabaseClient);
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
  const supabase = await getClient(supabaseClient);
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

export async function deleteAllPraktikan(
  supabaseClient?: SupabaseClient
): Promise<{ deleted: number }> {
  const supabase = await getClient(supabaseClient);

  const { data, error } = await supabase
    .from('praktikan')
    .delete()
    .not('id', 'is', null)
    .select('id');

  if (error) {
    logger.error('Error deleting all praktikan:', error);
    throw new Error(`Gagal menghapus seluruh data praktikan: ${error.message}`);
  }

  return { deleted: data?.length ?? 0 };
}
