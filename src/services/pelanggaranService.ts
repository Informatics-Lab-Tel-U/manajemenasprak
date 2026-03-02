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

export async function getPelanggaranCountsByPraktikum(
  isKoor: boolean,
  supabaseClient: SupabaseClient
): Promise<PelanggaranCountMap> {
  const client = isKoor ? supabaseClient : globalAdmin;

  const { data, error } = await client
    .from('pelanggaran')
    .select('jadwal:jadwal(mata_kuliah:mata_kuliah(id_praktikum, praktikum:praktikum(tahun_ajaran))), is_final');

  if (error) {
    logger.error('Error fetching pelanggaran counts:', error);
    return {};
  }

  const countMap = new Map<string, PelanggaranCountEntry>();

  for (const row of data ?? []) {
    const mk = (row as any).jadwal?.mata_kuliah;
    const id = mk?.id_praktikum;
    if (!id) continue;
    if (!countMap.has(id)) {
      countMap.set(id, { total: 0, allFinal: true, finalized: false });
    }
    const entry = countMap.get(id)!;
    entry.total += 1;
    if (!(row as any).is_final) entry.allFinal = false;
  }

  for (const [, entry] of countMap) {
    entry.finalized = entry.total > 0 && entry.allFinal;
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
 * Finalize all pelanggaran for a specific praktikum.
 */
export async function finalizePelanggaranByPraktikum(
  idPraktikum: string,
  finalizedBy: string
): Promise<void> {
  const supabase = globalAdmin; // Use admin client to bypass RLS for state transition

  // Get all mata_kuliah IDs for this praktikum
  const { data: mks, error: mkError } = await supabase
    .from('mata_kuliah')
    .select('id')
    .eq('id_praktikum', idPraktikum);

  if (mkError) throw new Error(`Gagal mengambil mata kuliah: ${mkError.message}`);
  const mkIds = (mks || []).map((m: any) => m.id);
  if (mkIds.length === 0) return;

  // Get all jadwal IDs for these mata_kuliah
  const { data: jadwals, error: jadwalError } = await supabase
    .from('jadwal')
    .select('id')
    .in('id_mk', mkIds);

  if (jadwalError) throw new Error(`Gagal mengambil jadwal: ${jadwalError.message}`);
  const jadwalIds = (jadwals || []).map((j: any) => j.id);
  if (jadwalIds.length === 0) return;

  const { error } = await supabase
    .from('pelanggaran')
    .update({
      is_final: true,
      finalized_at: new Date().toISOString(),
      finalized_by: finalizedBy,
    })
    .in('id_jadwal', jadwalIds)
    .eq('is_final', false);

  if (error) {
    logger.error('Error finalizing pelanggaran:', error);
    throw new Error(`Gagal memfinalisasi pelanggaran: ${error.message}`);
  }
}

/**
 * Finalize all pelanggaran for a specific mata kuliah (Backward Compatibility).
 */
export async function finalizePelanggaranByMataKuliah(
  idMk: string,
  finalizedBy: string
): Promise<void> {
  const supabase = globalAdmin; // Bypassing RLS

  const { data: jadwals, error: jadwalError } = await supabase
    .from('jadwal')
    .select('id')
    .eq('id_mk', idMk);

  if (jadwalError) throw new Error(`Gagal mengambil jadwal: ${jadwalError.message}`);

  const jadwalIds = (jadwals || []).map((j: any) => j.id);
  if (jadwalIds.length === 0) return;

  const { error } = await supabase
    .from('pelanggaran')
    .update({
      is_final: true,
      finalized_at: new Date().toISOString(),
      finalized_by: finalizedBy,
    })
    .in('id_jadwal', jadwalIds)
    .eq('is_final', false);

  if (error) {
    logger.error('Error finalizing pelanggaran:', error);
    throw new Error(`Gagal memfinalisasi pelanggaran: ${error.message}`);
  }
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

export async function deletePelanggaran(id: string, supabaseClient?: SupabaseClient): Promise<void> {
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
      '*, mata_kuliah:mata_kuliah(id, nama_lengkap, program_studi, id_praktikum, praktikum:praktikum(id, nama, tahun_ajaran))'
    )
    .order('kelas', { ascending: true });

  if (error) {
    logger.error('Error fetching jadwal for pelanggaran:', error);
    return [];
  }

  const jadwalRaw = (data ?? []) as any[];

  return jadwalRaw.map((j) => ({
    ...j,
    id_praktikum: j.mata_kuliah?.id_praktikum ?? null,
  })) as (Jadwal & { id_praktikum?: string | null })[];
}

export async function unfinalizePelanggaranByPraktikum(idPraktikum: string): Promise<void> {
  const supabase = globalAdmin; // Bypassing RLS for reset operation

  // Get all mata_kuliah IDs for this praktikum
  const { data: mks, error: mkError } = await supabase
    .from('mata_kuliah')
    .select('id')
    .eq('id_praktikum', idPraktikum);

  if (mkError) throw new Error(`Gagal mengambil mata kuliah: ${mkError.message}`);
  const mkIds = (mks || []).map((m: any) => m.id);
  if (mkIds.length === 0) return;

  // Get all jadwal IDs for these mata_kuliah
  const { data: jadwals, error: jadwalError } = await supabase
    .from('jadwal')
    .select('id')
    .in('id_mk', mkIds);

  if (jadwalError) throw new Error(`Gagal mengambil jadwal: ${jadwalError.message}`);
  const jadwalIds = (jadwals || []).map((j: any) => j.id);
  if (jadwalIds.length === 0) return;

  const { error } = await supabase
    .from('pelanggaran')
    .update({
      is_final: false,
      finalized_at: null,
      finalized_by: null,
    })
    .in('id_jadwal', jadwalIds)
    .eq('is_final', true);

  if (error) {
    logger.error('Error unfinalizing pelanggaran:', error);
    throw new Error(`Gagal mereset finalisasi pelanggaran: ${error.message}`);
  }
}

/**
 * Finalize all pelanggaran for a specific praktikum and modul.
 */
export async function finalizePelanggaranByModul(
  idPraktikum: string,
  modul: number,
  finalizedBy: string
): Promise<void> {
  const supabase = globalAdmin;

  // Get all mata_kuliah IDs for this praktikum
  const { data: mks, error: mkError } = await supabase
    .from('mata_kuliah')
    .select('id')
    .eq('id_praktikum', idPraktikum);

  if (mkError) throw new Error(`Gagal mengambil mata kuliah: ${mkError.message}`);
  const mkIds = (mks || []).map((m: any) => m.id);
  if (mkIds.length === 0) return;

  // Get all jadwal IDs for these mata_kuliah
  const { data: jadwals, error: jadwalError } = await supabase
    .from('jadwal')
    .select('id')
    .in('id_mk', mkIds);

  if (jadwalError) throw new Error(`Gagal mengambil jadwal: ${jadwalError.message}`);
  const jadwalIds = (jadwals || []).map((j: any) => j.id);
  if (jadwalIds.length === 0) return;

  const { error } = await supabase
    .from('pelanggaran')
    .update({
      is_final: true,
      finalized_at: new Date().toISOString(),
      finalized_by: finalizedBy,
    })
    .in('id_jadwal', jadwalIds)
    .eq('modul', modul)
    .eq('is_final', false);

  if (error) {
    logger.error('Error finalizing pelanggaran modul:', error);
    throw new Error(`Gagal memfinalisasi pelanggaran modul: ${error.message}`);
  }
}

/**
 * Get list of finalized modules for a praktikum.
 */
export async function getFinalizedModules(idPraktikum: string): Promise<number[]> {
  const supabase = globalAdmin;

  const { data: mks } = await supabase
    .from('mata_kuliah')
    .select('id')
    .eq('id_praktikum', idPraktikum);

  const mkIds = (mks || []).map((m: any) => m.id);
  if (mkIds.length === 0) return [];

  const { data: jadwals } = await supabase.from('jadwal').select('id').in('id_mk', mkIds);

  const jadwalIds = (jadwals || []).map((j: any) => j.id);
  if (jadwalIds.length === 0) return [];

  // A module is considered finalized if all violations in it are final, 
  // AND there is at least one violation OR we have a better way to track it.
  // In our scheme, we only track finalization ON the violations themselves.
  // Requirement: "jika sudah terfinalisasi, tampilkan juga di dropdown modul mana yg sudah terfinalisasi"
  // Since we don't have a "ModuleStatus" table, we check if violations exist and are all final for that modul.
  
  const { data: violations } = await supabase
    .from('pelanggaran')
    .select('modul, is_final')
    .in('id_jadwal', jadwalIds);

  if (!violations || violations.length === 0) return [];

  const moduleStatus = new Map<number, { allFinal: boolean }>();
  for (const v of violations) {
    if (!moduleStatus.has(v.modul)) {
      moduleStatus.set(v.modul, { allFinal: true });
    }
    if (!v.is_final) {
      moduleStatus.get(v.modul)!.allFinal = false;
    }
  }

  return Array.from(moduleStatus.entries())
    .filter(([_, status]) => status.allFinal)
    .map(([modul]) => modul);
}

/**
 * Unfinalize (reset) all pelanggaran for a specific praktikum and modul.
 */
export async function unfinalizePelanggaranByModul(
  idPraktikum: string,
  modul: number
): Promise<void> {
  const supabase = globalAdmin;

  // Get all mata_kuliah IDs for this praktikum
  const { data: mks, error: mkError } = await supabase
    .from('mata_kuliah')
    .select('id')
    .eq('id_praktikum', idPraktikum);

  if (mkError) throw new Error(`Gagal mengambil mata kuliah: ${mkError.message}`);
  const mkIds = (mks || []).map((m: any) => m.id);
  if (mkIds.length === 0) return;

  // Get all jadwal IDs for these mata_kuliah
  const { data: jadwals, error: jadwalError } = await supabase
    .from('jadwal')
    .select('id')
    .in('id_mk', mkIds);

  if (jadwalError) throw new Error(`Gagal mengambil jadwal: ${jadwalError.message}`);
  const jadwalIds = (jadwals || []).map((j: any) => j.id);
  if (jadwalIds.length === 0) return;

  const { error } = await supabase
    .from('pelanggaran')
    .update({
      is_final: false,
      finalized_at: null,
      finalized_by: null,
    })
    .in('id_jadwal', jadwalIds)
    .eq('modul', modul)
    .eq('is_final', true);

  if (error) {
    logger.error('Error unfinalizing pelanggaran modul:', error);
    throw new Error(`Gagal mereset finalisasi pelanggaran modul: ${error.message}`);
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

  let query = supabase
    .from('pelanggaran')
    .select(PELANGGARAN_SELECT);

  if (modul) {
    query = query.eq('modul', modul);
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
