import 'server-only';
import { cache } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { Asprak } from '@/types/database';
import type { Role } from '@/config/rbac';
import { logger } from '@/lib/logger';
import { checkCodeConflict, generateConflictErrorMessage, generateExpiredCode } from '@/utils/conflict';
import { generateAsprakCode } from '@/utils/asprakCodeGenerator';
import { getCachedAvailableTerms as getCachedTerms } from './termService';

export async function checkNimExists(
  nim: string,
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  const supabase = supabaseClient ?? (await createClient());
  const { data } = await supabase.from('asprak').select('id').eq('nim', nim).maybeSingle();
  return !!data;
}

export async function generateUniqueCode(
  nama: string,
  supabaseClient?: SupabaseClient,
  forceOverride: boolean = false
): Promise<{ code: string; rule: string }> {
  const supabase = supabaseClient ?? (await createClient());
  const existingCodes = await getExistingCodes(supabase);

  const usedCodesSet = forceOverride ? new Set<string>() : new Set(existingCodes);

  try {
    const result = generateAsprakCode(nama, usedCodesSet);
    return result;
  } catch {
    return { code: '', rule: 'Manual Input Required' };
  }
}

export async function getAllAsprak(
  term?: string,
  supabaseClient?: SupabaseClient
): Promise<Asprak[]> {
  const supabase = supabaseClient ?? (await createClient());

  let query;
  if (term && term !== 'all') {
    const { data: praktikums } = await supabase
      .from('praktikum')
      .select('id')
      .eq('tahun_ajaran', term);

    if (!praktikums || praktikums.length === 0) {
      return [];
    }

    const pIds = praktikums.map((p) => p.id);
    const { data: apData } = await supabase
      .from('asprak_praktikum')
      .select('id_asprak')
      .in('id_praktikum', pIds);

    if (!apData || apData.length === 0) {
      return [];
    }

    const asprakIds = Array.from(new Set(apData.map((ap) => ap.id_asprak)));

    query = supabase
      .from('asprak')
      .select('*')
      .in('id', asprakIds)
      .order('nama_lengkap', { ascending: true });
  } else {
    query = supabase.from('asprak').select('*').order('nama_lengkap', { ascending: true });
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching asprak:', error);
    throw new Error(`Failed to fetch asprak: ${error.message}`);
  }

  return (data || []).map((item: unknown) => {
    const row = item as {
      id: string;
      nama_lengkap: string;
      nim: string;
      kode: string;
      role?: string;
      angkatan: number;
      created_at: string;
    };
    return {
      id: row.id,
      nama_lengkap: row.nama_lengkap,
      nim: row.nim,
      kode: row.kode,
      role: row.role as Role,
      angkatan: row.angkatan,
      created_at: row.created_at,
    };
  }) as Asprak[];
}

export interface AsprakWithMap extends Asprak {
  assignments: {
    id: string;
    nama: string;
    tahun_ajaran: string;
  }[];
}

export async function getAspraksWithAssignments(
  term?: string,
  supabaseClient?: SupabaseClient
): Promise<AsprakWithMap[]> {
  const supabase = supabaseClient ?? (await createClient());
  const query = supabase
    .from('asprak')
    .select(
      `
        *,
        asprak_praktikum (
            praktikum (
                id,
                nama,
                tahun_ajaran
            )
        )
    `
    )
    .order('nama_lengkap', { ascending: true });

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching plotting data:', error);
    throw new Error(`Failed to fetch plotting data: ${error.message}`);
  }

  type RawPraktikum = { id: string; nama: string; tahun_ajaran: string };
  type RawAssignmentRow = Omit<Asprak, 'created_at' | 'updated_at'> & {
    created_at: string;
    updated_at: string | null;
    asprak_praktikum: { praktikum: RawPraktikum }[] | null;
  };

  const result: AsprakWithMap[] = (data || []).map((item: unknown) => {
    const row = item as RawAssignmentRow;
    const allAssignments = (row.asprak_praktikum || [])
      .map((ap) => ap.praktikum)
      .filter((p) => !!p);

    const filteredAssignments =
      term && term !== 'all'
        ? allAssignments.filter((p: RawPraktikum) => p.tahun_ajaran === term)
        : allAssignments;

    return {
      id: row.id,
      nama_lengkap: row.nama_lengkap,
      nim: row.nim,
      kode: row.kode,
      role: row.role,
      angkatan: row.angkatan,
      created_at: row.created_at,
      updated_at: row.updated_at ?? '',
      assignments: filteredAssignments,
    };
  });

  if (term && term !== 'all') {
    return result.filter((r) => r.assignments.length > 0);
  }

  return result;
}

export async function deleteAsprak(id: string, supabaseClient?: SupabaseClient): Promise<void> {
  const supabase = supabaseClient ?? (await createClient());
  const { error } = await supabase.from('asprak').delete().eq('id', id);
  if (error) {
    logger.error(`Error deleting asprak ${id}:`, error);
    throw new Error(`Failed to delete asprak: ${error.message}`);
  }
}

export async function getExistingCodes(supabaseClient?: SupabaseClient): Promise<string[]> {
  const supabase = supabaseClient ?? (await createClient());
  const { data } = await supabase.from('asprak').select('kode');
  if (!data) return [];
  return Array.from(new Set<string>(data.map((d) => d.kode as string))).sort((a, b) => a.localeCompare(b));
}

export const getCachedAvailableTerms = getCachedTerms;

export const getCachedAllAsprak = cache(
  async (term?: string, supabaseClient?: SupabaseClient): Promise<Asprak[]> => {
    return getAllAsprak(term, supabaseClient);
  }
);

export const getCachedAspraksWithAssignments = cache(
  async (term?: string, supabaseClient?: SupabaseClient): Promise<AsprakWithMap[]> => {
    return getAspraksWithAssignments(term, supabaseClient);
  }
);

export async function getAsprakAssignments(
  asprakId: number | string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient ?? (await createClient());
  const { data, error } = await supabase
    .from('asprak_praktikum')
    .select(
      `
            id,
            praktikum:praktikum (
                id,
                nama,
                tahun_ajaran
            )
        `
    )
    .eq('id_asprak', asprakId);

  if (error) {
    logger.error('Error fetching assignments:', error);
    throw new Error(`Failed to fetch assignments: ${error.message}`);
  }
  return data || [];
}

export interface UpsertAsprakInput {
  nim: string;
  nama_lengkap: string;
  kode: string;
  role: 'ASPRAK' | 'ASLAB';
  angkatan: number;
  assignments: {
    term: string;
    praktikumNames: string[];
  }[];
  forceOverride?: boolean;
}

async function getOrCreatePraktikum(
  name: string,
  term: string,
  supabase: SupabaseClient
): Promise<string> {
  const { data: existing } = await supabase
    .from('praktikum')
    .select('id')
    .eq('nama', name)
    .eq('tahun_ajaran', term)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('praktikum')
    .insert({ nama: name, tahun_ajaran: term })
    .select()
    .single();

  if (error) throw error;
  return created.id;
}

async function handleCodeConflictAndExpire(
  newCode: string,
  nim: string,
  forceOverride: boolean,
  supabase: SupabaseClient
): Promise<void> {
  const { data: codeOwners } = await supabase.from('asprak').select('*').eq('kode', newCode);

  if (!codeOwners || codeOwners.length === 0) return;

  await Promise.all(
    codeOwners.map(async (owner: any) => {
      const conflictCheck = checkCodeConflict(owner, nim);
      if (!conflictCheck.hasConflict) return;

      const currentYear = new Date().getFullYear();
      const gap = currentYear - (owner.angkatan || 0);

      if (gap < 1) {
        throw new Error(
          `KODE KERAS: Kode '${newCode}' sedang aktif digunakan oleh ${owner.nama_lengkap}.`
        );
      }

      if (!forceOverride) {
        throw new Error(generateConflictErrorMessage(newCode, owner));
      }

      const expiredCode = generateExpiredCode(newCode, owner.id);
      const { error: updateError } = await supabase
        .from('asprak')
        .update({ kode: expiredCode })
        .eq('id', owner.id);

      if (updateError) {
        throw new Error(`Gagal update kode untuk ${owner.nama_lengkap}: ${updateError.message}`);
      }
    })
  );
}

async function upsertOrInsertAsprak(
  input: UpsertAsprakInput,
  supabase: SupabaseClient
): Promise<string> {
  const { data: existingUser } = await supabase
    .from('asprak')
    .select('id')
    .eq('nim', input.nim)
    .maybeSingle();

  if (existingUser) {
    const { error: upError } = await supabase
      .from('asprak')
      .update({
        nama_lengkap: input.nama_lengkap,
        kode: input.kode,
        role: input.role,
        angkatan: input.angkatan,
      })
      .eq('id', existingUser.id);

    if (upError) throw upError;
    return existingUser.id;
  }

  const { data: newUser, error: inError } = await supabase
    .from('asprak')
    .insert({
      nim: input.nim,
      nama_lengkap: input.nama_lengkap,
      kode: input.kode,
      role: input.role,
      angkatan: input.angkatan,
    })
    .select()
    .single();

  if (inError) throw inError;
  return newUser.id;
}

async function linkAssignments(
  asprakId: string,
  assignments: UpsertAsprakInput['assignments'],
  supabase: SupabaseClient
): Promise<void> {
  // First, extract all unique terms and praktikumNames
  const neededPraktikums: { name: string; term: string }[] = [];
  for (const assign of assignments) {
    for (const name of assign.praktikumNames) {
      neededPraktikums.push({ name, term: assign.term });
    }
  }

  if (neededPraktikums.length === 0) return;

  const uniqueNeeded = Array.from(new Set(neededPraktikums.map((p) => `${p.name}::${p.term}`))).map((key) => {
    const parts = key.split('::');
    return { name: parts[0], term: parts[1] };
  });

  // Resolve all praktikum IDs
  const praktikumIds = await Promise.all(
    uniqueNeeded.map((p) => getOrCreatePraktikum(p.name, p.term, supabase))
  );

  // Remove duplicates
  const uniquePraktikumIds = Array.from(new Set(praktikumIds));

  if (uniquePraktikumIds.length === 0) return;

  // Now, fetch existing links
  const { data: existingLinks } = await supabase
    .from('asprak_praktikum')
    .select('id_praktikum')
    .eq('id_asprak', asprakId)
    .in('id_praktikum', uniquePraktikumIds);

  const existingSet = new Set(existingLinks?.map((l) => l.id_praktikum) || []);

  const newLinks = uniquePraktikumIds.reduce<{ id_asprak: string; id_praktikum: string }[]>(
    (acc, pid) => {
      if (!existingSet.has(pid)) {
        acc.push({ id_asprak: asprakId, id_praktikum: pid });
      }
      return acc;
    },
    []
  );

  if (newLinks.length > 0) {
    await supabase.from('asprak_praktikum').insert(newLinks);
  }
}

export async function upsertAsprak(
  input: UpsertAsprakInput,
  supabaseClient?: SupabaseClient
): Promise<string> {
  const supabase = supabaseClient ?? (await createClient());
  let angkatan = input.angkatan;
  if (angkatan < 100) angkatan += 2000;

  await handleCodeConflictAndExpire(input.kode, input.nim, input.forceOverride ?? false, supabase);

  const asprakId = await upsertOrInsertAsprak({ ...input, angkatan }, supabase);

  await linkAssignments(asprakId, input.assignments, supabase);

  return asprakId;
}

export interface BulkUpsertRow {
  nim: string;
  nama_lengkap: string;
  kode: string;
  role: 'ASPRAK' | 'ASLAB';
  angkatan: number;
}

export interface BulkUpsertResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
  kodeToIdMap: Record<string, string>;
}

function buildUpsertPayloads(
  rows: BulkUpsertRow[],
  existingMap: Map<string, string>
): { upsertPayload: any[]; insertPayload: any[]; skipped: number } {
  const upsertPayload = [];
  const insertPayload = [];
  const seenNimRole = new Set();
  let skipped = 0;

  for (const row of rows) {
    const uniqueKey = `${row.nim}_${row.role}`;
    if (seenNimRole.has(uniqueKey)) {
      skipped++;
      continue;
    }
    seenNimRole.add(uniqueKey);

    const angkatan = row.angkatan > 0 && row.angkatan < 100 ? row.angkatan + 2000 : row.angkatan;

    const data = {
      nim: row.nim,
      nama_lengkap: row.nama_lengkap,
      kode: row.kode,
      role: row.role,
      angkatan,
    };

    const existingId = existingMap.get(uniqueKey);
    if (existingId) {
      upsertPayload.push({ id: existingId, ...data });
    } else {
      insertPayload.push(data);
    }
  }

  return { upsertPayload, insertPayload, skipped };
}

export async function bulkUpsertAspraks(
  rows: BulkUpsertRow[],
  supabaseClient?: SupabaseClient
): Promise<BulkUpsertResult> {
  const supabase = supabaseClient ?? (await createClient());
  const result: BulkUpsertResult = { inserted: 0, updated: 0, skipped: 0, errors: [], kodeToIdMap: {} };

  if (rows.length === 0) return result;

  try {
    const nims = rows.map((r) => r.nim);

    const { data: existing } = await supabase
      .from('asprak')
      .select('id, nim, role')
      .in('nim', nims);

    const existingMap = new Map((existing || []).map((e) => [`${e.nim}_${e.role}`, e.id]));

    const { upsertPayload, insertPayload, skipped } = buildUpsertPayloads(rows, existingMap);
    result.skipped = skipped;

    if (upsertPayload.length > 0) {
      const { data, error } = await supabase.from('asprak').upsert(upsertPayload).select('id, kode');
      if (error) {
        result.errors.push(`Bulk updates err: ${error.message}`);
      } else {
        result.updated = upsertPayload.length;
        data?.forEach((d) => {
          result.kodeToIdMap[d.kode] = d.id;
        });
      }
    }

    if (insertPayload.length > 0) {
      const { data, error } = await supabase.from('asprak').insert(insertPayload).select('id, kode');
      if (error) {
        result.errors.push(`Bulk inserts err: ${error.message}`);
      } else {
        result.inserted = insertPayload.length;
        data?.forEach((d) => {
          result.kodeToIdMap[d.kode] = d.id;
        });
      }
    }
  } catch (e: any) {
    const errMsg = e instanceof Error ? e.message : String(e);
    result.errors.push(`Process err: ${errMsg}`);
  }

  return result;
}

async function updateAsprakCodeIfNeeded(
  asprakId: string | number,
  newKode: string | undefined,
  nim: string | undefined,
  forceOverride: boolean,
  supabase: SupabaseClient
): Promise<void> {
  if (!newKode || !nim) return;

  await handleCodeConflictAndExpire(newKode, nim, forceOverride, supabase);

  const { error: updateError } = await supabase
    .from('asprak')
    .update({ kode: newKode })
    .eq('id', asprakId);

  if (updateError) {
    throw new Error(`Gagal update kode: ${updateError.message}`);
  }
}

async function calculateAssignmentChanges(
  asprakId: string | number,
  newPraktikumIds: string[],
  term: string,
  supabase: SupabaseClient
): Promise<{ toDelete: string[]; toInsert: string[] }> {
  const { data: existingAll } = await supabase
    .from('asprak_praktikum')
    .select('id, id_praktikum')
    .eq('id_asprak', asprakId);

  let existingInScope = existingAll || [];

  if (term && term !== 'all') {
    const { data: termPraktikums } = await supabase
      .from('praktikum')
      .select('id')
      .eq('tahun_ajaran', term);

    if (termPraktikums) {
      const termPids = new Set(termPraktikums.map((p) => p.id));
      existingInScope = existingInScope.filter((a) => termPids.has(a.id_praktikum));
    }
  }

  const newSet = new Set(newPraktikumIds);
  const toDelete = existingInScope.flatMap((a) => !newSet.has(a.id_praktikum) ? [a.id] : []);

  const existingAllPids = new Set((existingAll || []).map((a) => a.id_praktikum));
  const toInsert = newPraktikumIds.filter((pid) => !existingAllPids.has(pid));

  return { toDelete, toInsert };
}

export async function updateAsprakAssignments(
  asprakId: number | string,
  term: string,
  praktikumIds: string[],
  supabaseClient?: SupabaseClient,
  newKode?: string,
  nim?: string,
  forceOverride: boolean = false
): Promise<void> {
  const supabase = supabaseClient ?? (await createClient());

  await updateAsprakCodeIfNeeded(asprakId, newKode, nim, forceOverride, supabase);

  const { toDelete, toInsert } = await calculateAssignmentChanges(
    asprakId,
    praktikumIds,
    term,
    supabase
  );

  if (toDelete.length > 0) {
    const { error: delError } = await supabase.from('asprak_praktikum').delete().in('id', toDelete);
    if (delError) {
      throw new Error(`Delete failed: ${delError.message}`);
    }
  }

  if (toInsert.length > 0) {
    const rows = toInsert.map((pid) => ({
      id_asprak: asprakId,
      id_praktikum: pid,
    }));

    const { error: insError } = await supabase.from('asprak_praktikum').insert(rows);

    if (insError) {
      throw new Error(`Insert failed: ${insError.message}`);
    }
  }
}
