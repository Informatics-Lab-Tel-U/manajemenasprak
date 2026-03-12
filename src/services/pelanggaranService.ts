import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Pelanggaran, Praktikum, Jadwal } from '@/types/database';
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
      program_studi,
      id_praktikum,
      praktikum:praktikum (
        id,
        nama,
        tahun_ajaran
      )
    )
  )
`;

export type PelanggaranCountEntry = {
  total: number;
  allFinal: boolean;
  finalized: boolean;
};

export type PelanggaranCountMap = Record<string, PelanggaranCountEntry>;

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

export async function getKoorPraktikumList(
  userId: string,
  supabaseClient: SupabaseClient
): Promise<Praktikum[]> {
  const { data, error } = await supabaseClient
    .from('asprak_koordinator')
    .select('id_praktikum, praktikum:praktikum(id, nama, tahun_ajaran)')
    .eq('id_pengguna', userId)
    .eq('is_active', true);

  if (error) {
    logger.error('Error fetching koor praktikum list:', error);
    return [];
  }

  const seen = new Set<string>();
  const praktikumList: Praktikum[] = [];

  for (const a of data ?? []) {
    const p = (a as any).praktikum;
    if (p && !seen.has(p.id)) {
      seen.add(p.id);
      praktikumList.push(p as Praktikum);
    }
  }

  return praktikumList;
}

export async function getPelanggaranByFilter(
  idPraktikum?: string,
  tahunAjaran?: string,
  supabaseClient?: SupabaseClient
): Promise<Pelanggaran[]> {
  const supabase = supabaseClient || globalAdmin;
  let query = supabase
    .from('pelanggaran')
    .select(PELANGGARAN_SELECT)
    .order('created_at', { ascending: false });

  if (idPraktikum) {
    query = query.eq('jadwal.mata_kuliah.id_praktikum', idPraktikum);
  }
  if (tahunAjaran) {
    query = query.eq('jadwal.mata_kuliah.praktikum.tahun_ajaran', tahunAjaran);
  }

  const { data, error } = await query;
  if (error) {
    logger.error('Error fetching pelanggaran by filter:', error);
    return [];
  }
  return (data as Pelanggaran[]).filter((p) => {
    const mk = p.jadwal?.mata_kuliah as any;
    if (idPraktikum && mk?.id_praktikum !== idPraktikum) return false;
    if (tahunAjaran && mk?.praktikum?.tahun_ajaran !== tahunAjaran) return false;
    return true;
  });
}

export async function getPelanggaranByKoor(
  supabaseClient?: SupabaseClient
): Promise<Pelanggaran[]> {
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

export async function getPelanggaranCountsByPraktikum(
  isKoor: boolean,
  supabaseClient: SupabaseClient
): Promise<PelanggaranCountMap> {
  const client = isKoor ? supabaseClient : globalAdmin;

  // 1. Get total violations per praktikum
  const { data: violations, error: vError } = await client
    .from('pelanggaran')
    .select('jadwal:jadwal(mata_kuliah:mata_kuliah(id_praktikum))');

  if (vError) {
    logger.error('Error fetching pelanggaran counts:', vError);
    return {};
  }

  // 2. Get finalized modules per praktikum
  const { data: status, error: sError } = await client
    .from('pelanggaran_status')
    .select('id_praktikum, is_finalized')
    .eq('is_finalized', true);

  if (sError) {
    logger.error('Error fetching finalized status:', sError);
    return {};
  }

  const countMap = new Map<string, PelanggaranCountEntry>();

  // Count violations
  for (const row of violations ?? []) {
    const id = (row as any).jadwal?.mata_kuliah?.id_praktikum;
    if (!id) continue;
    if (!countMap.has(id)) {
      countMap.set(id, { total: 0, allFinal: false, finalized: false });
    }
    countMap.get(id)!.total += 1;
  }

  // Mark practicals as finalized if ANY module is finalized (or according to your definition)
  // Here we keep it simple: shown as 'finalized' if there's at least one finalized status entry for it
  for (const s of status ?? []) {
    if (countMap.has(s.id_praktikum)) {
      countMap.get(s.id_praktikum)!.finalized = true;
    }
  }

  return Object.fromEntries(countMap);
}

export async function createPelanggaran(
  input: CreatePelanggaranInput,
  supabaseClient?: SupabaseClient
): Promise<Pelanggaran> {
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

export async function bulkCreatePelanggaran(
  inputs: CreatePelanggaranInput[],
  supabaseClient?: SupabaseClient
): Promise<Pelanggaran[]> {
  const supabase = supabaseClient || globalAdmin;
  const { data, error } = await supabase
    .from('pelanggaran')
    .insert(inputs)
    .select(PELANGGARAN_SELECT);

  if (error) {
    logger.error('Error bulk creating pelanggaran:', error);
    throw new Error(`Gagal mencatat pelanggaran: ${error.message}`);
  }
  return data as Pelanggaran[];
}

/**
 * Finalize all modules for a specific praktikum.
 */
export async function finalizePelanggaranByPraktikum(
  id_praktikum: string,
  finalizedBy: string
): Promise<void> {
  const supabase = globalAdmin;

  // We finalize all 14 modules
  const inserts = Array.from({ length: 14 }, (_, i) => ({
    id_praktikum,
    modul: i + 1,
    is_finalized: true,
    finalized_at: new Date().toISOString(),
    finalized_by: finalizedBy,
  }));

  const { error } = await supabase
    .from('pelanggaran_status')
    .upsert(inserts, { onConflict: 'id_praktikum, modul' });

  if (error) {
    logger.error('Error finalizing praktikum:', error);
    throw new Error(`Gagal memfinalisasi praktikum: ${error.message}`);
  }
}

/**
 * Finalize all pelanggaran for a specific mata kuliah (No longer supported with centralized status).
 */
export async function finalizePelanggaranByMataKuliah(): Promise<void> {
  throw new Error('Finalisasi per mata kuliah tidak lagi didukung. Gunakan finalisasi per modul.');
}

export async function getExportData(
  idPraktikum?: string,
  tahunAjaran?: string,
  supabaseClient?: SupabaseClient
): Promise<
  {
    mk: string;
    kode: string;
    modul: string;
    kelas: string;
    jenis: string;
  }[]
> {
  const records = await getPelanggaranByFilter(idPraktikum, tahunAjaran, supabaseClient);
  return records.map((p) => ({
    mk: p.jadwal?.mata_kuliah?.praktikum?.nama ?? '',
    kode: p.asprak?.kode ?? '',
    modul: p.modul ? String(p.modul) : '',
    kelas: p.jadwal?.kelas ?? '',
    jenis: p.jenis ?? '',
  }));
}

export async function deletePelanggaran(
  id: string,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient || globalAdmin;
  const { error } = await supabase.from('pelanggaran').delete().eq('id', id);

  if (error) {
    logger.error('Error deleting pelanggaran:', error);
    throw new Error(`Gagal menghapus pelanggaran: ${error.message}`);
  }
}

export async function getJadwalForPelanggaran(
  supabaseClient?: SupabaseClient
): Promise<(Jadwal & { id_praktikum?: string | null })[]> {
  const supabase = supabaseClient || globalAdmin;

  const { data, error } = await supabase
    .from('jadwal')
    .select(
      '*, mata_kuliah:mata_kuliah(id, nama_lengkap, program_studi, id_praktikum, praktikum:praktikum(id, nama, tahun_ajaran)), jadwal_pengganti(*)'
    )
    .order('kelas', { ascending: true });

  if (error) {
    logger.error('Error fetching jadwal for pelanggaran:', error);
    return [];
  }

  const jadwalRaw = data ?? [];

  return jadwalRaw.map((j) => ({
    ...j,
    id_praktikum: j.mata_kuliah?.id_praktikum ?? null,
  })) as (Jadwal & { id_praktikum?: string | null })[];
}

export async function unfinalizePelanggaranByPraktikum(idPraktikum: string): Promise<void> {
  const supabase = globalAdmin;

  const { error } = await supabase
    .from('pelanggaran_status')
    .delete()
    .eq('id_praktikum', idPraktikum);

  if (error) {
    logger.error('Error unfinalizing praktikum:', error);
    throw new Error(`Gagal mereset finalisasi praktikum: ${error.message}`);
  }
}

/**
 * Finalize all pelanggaran for a specific praktikum and modul.
 */
export async function finalizePelanggaranByModul(
  id_praktikum: string,
  modul: number,
  finalizedBy: string
): Promise<void> {
  const supabase = globalAdmin;

  const { error } = await supabase.from('pelanggaran_status').upsert(
    {
      id_praktikum,
      modul,
      is_finalized: true,
      finalized_at: new Date().toISOString(),
      finalized_by: finalizedBy,
    },
    { onConflict: 'id_praktikum, modul' }
  );

  if (error) {
    logger.error('Error finalizing pelanggaran modul:', error);
    throw new Error(`Gagal memfinalisasi modul: ${error.message}`);
  }
}

/**
 * Get list of finalized modules for a praktikum.
 */
export async function getFinalizedModules(idPraktikum: string): Promise<number[]> {
  const supabase = globalAdmin;

  const { data, error } = await supabase
    .from('pelanggaran_status')
    .select('modul')
    .eq('id_praktikum', idPraktikum)
    .eq('is_finalized', true);

  if (error || !data) return [];
  return data.map((d) => d.modul);
}

/**
 * Unfinalize (reset) all pelanggaran for a specific praktikum and modul.
 */
export async function unfinalizePelanggaranByModul(
  id_praktikum: string,
  modul: number
): Promise<void> {
  const supabase = globalAdmin;

  const { error } = await supabase
    .from('pelanggaran_status')
    .delete()
    .eq('id_praktikum', id_praktikum)
    .eq('modul', modul);

  if (error) {
    logger.error('Error unfinalizing modul:', error);
    throw new Error(`Gagal mereset finalisasi modul: ${error.message}`);
  }
}

/**
 * Summary entry for aggregated violation reports.
 */
export type PelanggaranSummaryEntry = {
  id_asprak: string;
  nama_asprak: string;
  kode_asprak: string;
  nim_asprak: string;
  total_pelanggaran: number;
  violations: Pelanggaran[];
};

/**
 * Get aggregated summary of violations across all asprak for a given year/module.
 */
export async function getPelanggaranSummary(
  tahunAjaran: string,
  modul?: number,
  minCount: number = 1,
  supabaseClient?: SupabaseClient
): Promise<PelanggaranSummaryEntry[]> {
  const supabase = supabaseClient || globalAdmin;

  let query = supabase.from('pelanggaran').select(PELANGGARAN_SELECT);

  if (modul) {
    query = query.lte('modul', modul);
  }

  const { data, error } = await query;
  if (error) {
    logger.error('Error fetching violation summary:', error);
    return [];
  }

  // Client-side filter for tahun_ajaran as it's deep in relations
  const violations = (data as Pelanggaran[]).filter((p) => {
    const mk = p.jadwal?.mata_kuliah as any;
    return mk?.praktikum?.tahun_ajaran === tahunAjaran;
  });

  const summaryMap = new Map<string, PelanggaranSummaryEntry>();

  for (const v of violations) {
    const asprakId = v.id_asprak;
    if (!asprakId) continue;
    if (!summaryMap.has(asprakId)) {
      summaryMap.set(asprakId, {
        id_asprak: asprakId,
        nama_asprak: v.asprak?.nama_lengkap ?? '—',
        kode_asprak: v.asprak?.kode ?? '—',
        nim_asprak: v.asprak?.nim ?? '—',
        total_pelanggaran: 0,
        violations: [],
      });
    }
    const entry = summaryMap.get(asprakId)!;
    entry.total_pelanggaran += 1;
    entry.violations.push(v);
  }

  return Array.from(summaryMap.values())
    .filter((entry) => entry.total_pelanggaran >= minCount)
    .sort((a, b) => b.total_pelanggaran - a.total_pelanggaran);
}
