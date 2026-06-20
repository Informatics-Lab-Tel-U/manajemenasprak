import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { MataKuliah } from '@/types/database';
import { logger } from '@/lib/logger';

export interface MataKuliahWithPraktikum extends MataKuliah {
  praktikum: {
    id: string;
    nama: string;
    tahun_ajaran: string;
  };
}

export type MataKuliahGrouped = {
  mk_singkat: string;
  praktikum_id: string;
  items: MataKuliahWithPraktikum[];
};

export async function getMataKuliahByTerm(
  term: string | null,
  supabaseClient?: SupabaseClient
): Promise<MataKuliahGrouped[]> {
  const supabase = supabaseClient ?? (await createClient());
  let query = supabase.from('mata_kuliah').select(`
      *,
      praktikum:praktikum!inner (
        id,
        nama,
        tahun_ajaran
      )
    `);

  if (term && term !== 'all') {
    query = query.eq('praktikum.tahun_ajaran', term);
  }

  const { data, error } = await query.order('nama_lengkap');

  if (error) {
    logger.error('Error fetching mata kuliah for term ' + term + ':', error);
    return [];
  }

  const rawData = data as unknown as MataKuliahWithPraktikum[];

  const groupedMap: Record<string, MataKuliahGrouped> = {};

  rawData.forEach((mk) => {
    const mkSingkat = mk.praktikum.nama;
    if (!groupedMap[mkSingkat]) {
      groupedMap[mkSingkat] = {
        mk_singkat: mkSingkat,
        praktikum_id: mk.praktikum.id,
        items: [],
      };
    }
    groupedMap[mkSingkat].items.push(mk);
  });

  return Object.values(groupedMap).sort((a, b) => a.mk_singkat.localeCompare(b.mk_singkat));
}

export interface CreateMataKuliahPayload {
  id_praktikum: string;
  nama_lengkap: string;
  program_studi: string;
  dosen_koor: string;
  warna?: string;
}

export async function createMataKuliah(
  payload: CreateMataKuliahPayload,
  supabaseClient?: SupabaseClient
): Promise<MataKuliah | null> {
  const supabase = supabaseClient ?? (await createClient());
  const { data, error } = await supabase.from('mata_kuliah').insert(payload).select().single();

  if (error) {
    logger.error('Error creating mata kuliah:', error);
    throw error;
  }

  return data;
}

export interface BulkImportMataKuliahResult {
  inserted: number;
  errors: string[];
}

export async function bulkCreateMataKuliah(
  payloads: CreateMataKuliahPayload[],
  supabaseClient?: SupabaseClient
): Promise<BulkImportMataKuliahResult> {
  const supabase = supabaseClient ?? (await createClient());
  const result: BulkImportMataKuliahResult = { inserted: 0, errors: [] };

  if (payloads.length === 0) return result;

  const uniquePayloads = [];
  const seen = new Set();
  for (const p of payloads) {
    const key = `${p.id_praktikum}_${p.program_studi}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniquePayloads.push(p);
    }
  }

  const { data, error } = await supabase.from('mata_kuliah').insert(uniquePayloads).select();

  if (error) {
    result.errors.push(`Bulk insert err: ${error.message}`);
  } else {
    result.inserted = data?.length || 0;
  }

  return result;
}

export async function checkMataKuliahExists(
  praktikumId: string,
  programStudi: string,
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  const supabase = supabaseClient ?? (await createClient());
  const { count, error } = await supabase
    .from('mata_kuliah')
    .select('*', { count: 'exact', head: true })
    .eq('id_praktikum', praktikumId)
    .eq('program_studi', programStudi);

  if (error) {
    console.error(error);
    return false;
  }

  return (count || 0) > 0;
}

export async function updateMataKuliahColorByPraktikumName(
  nama: string,
  warna: string,
  supabaseClient?: SupabaseClient
): Promise<number> {
  const supabase = supabaseClient ?? (await createClient());

  const { data: praktikums, error: pError } = await supabase
    .from('praktikum')
    .select('id')
    .eq('nama', nama);

  if (pError || !praktikums || praktikums.length === 0) {
    return 0;
  }

  const pIds = praktikums.map((p) => p.id);

  const { data, error: mkError } = await supabase
    .from('mata_kuliah')
    .update({ warna })
    .in('id_praktikum', pIds)
    .select();

  if (mkError) {
    logger.error(`Error updating colors for praktikum ${nama}:`, mkError);
    throw mkError;
  }

  return data?.length || 0;
}
