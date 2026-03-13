import 'server-only';
import { cache } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { Asprak } from '@/types/database';
import type { Role } from '@/config/rbac';
import { logger } from '@/lib/logger';
import { checkCodeConflict, generateConflictErrorMessage } from '@/utils/conflict';
import { generateAsprakCode } from '@/utils/asprakCodeGenerator';
import { getCachedAvailableTerms as getCachedTerms } from './termService';

// Admin Supabase client (bypasses RLS). This service is only used from API routes/server.
const globalAdmin = createAdminClient();

export async function checkNimExists(
  nim: string,
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  const supabase = supabaseClient || globalAdmin;
  const { data } = await supabase.from('asprak').select('id').eq('nim', nim).maybeSingle();
  return !!data;
}

export async function generateUniqueCode(
  nama: string,
  supabaseClient?: SupabaseClient
): Promise<{ code: string; rule: string }> {
  const supabase = supabaseClient || globalAdmin;
  const existingCodes = await getExistingCodes(supabase);
  const usedCodesSet = new Set(existingCodes);

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
  const supabase = supabaseClient || globalAdmin;

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
      .order('nim', { ascending: true });
  } else {
    query = supabase.from('asprak').select('*').order('nim', { ascending: true });
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
  const supabase = supabaseClient || globalAdmin;
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
    .order('nim', { ascending: true });

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
  const supabase = supabaseClient || globalAdmin;
  const { error } = await supabase.from('asprak').delete().eq('id', id);
  if (error) {
    logger.error(`Error deleting asprak ${id}:`, error);
    throw new Error(`Failed to delete asprak: ${error.message}`);
  }
}

export async function getExistingCodes(supabaseClient?: SupabaseClient): Promise<string[]> {
  const supabase = supabaseClient || globalAdmin;
  const { data } = await supabase.from('asprak').select('kode');
  if (!data) return [];
  return Array.from(new Set(data.map((d) => d.kode as string))).sort((a, b) => a.localeCompare(b));
}

/**
 * Re-export getCachedAvailableTerms from termService (shared business logic)
 * This prevents code duplication across services
 */
export const getCachedAvailableTerms = getCachedTerms;

/**
 * Cached version of getAllAsprak
 * Deduplicates requests within a single render/request cycle
 */
export const getCachedAllAsprak = cache(
  async (term?: string, supabaseClient?: SupabaseClient): Promise<Asprak[]> => {
    return getAllAsprak(term, supabaseClient);
  }
);

/**
 * Cached version of getAspraksWithAssignments
 * Deduplicates requests within a single render/request cycle
 */
export const getCachedAspraksWithAssignments = cache(
  async (term?: string, supabaseClient?: SupabaseClient): Promise<AsprakWithMap[]> => {
    return getAspraksWithAssignments(term, supabaseClient);
  }
);

export async function getAsprakAssignments(
  asprakId: number | string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || globalAdmin;
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

/**
 * Helper: Get or create praktikum by name and term
 */
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

/**
 * Helper: Handle code conflict and mark existing code as expired
 */
async function handleCodeConflictAndExpire(
  newCode: string,
  nim: string,
  forceOverride: boolean,
  supabase: SupabaseClient
): Promise<void> {
  const { data: codeOwner } = await supabase
    .from('asprak')
    .select('*')
    .eq('kode', newCode)
    .maybeSingle();

  const conflictCheck = checkCodeConflict(codeOwner, nim);
  if (conflictCheck.hasConflict && conflictCheck.existingOwner && !forceOverride) {
    throw new Error(generateConflictErrorMessage(newCode, conflictCheck.existingOwner));
  }

  if (codeOwner && codeOwner.nim !== nim) {
    await supabase
      .from('asprak')
      .update({
        kode: `${codeOwner.kode}_EXPIRED_${codeOwner.id.substring(0, 4)}`,
      })
      .eq('id', codeOwner.id);
  }
}

/**
 * Helper: Upsert or insert asprak record
 */
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

/**
 * Helper: Link asprak to praktikums
 */
async function linkAssignments(
  asprakId: string,
  assignments: UpsertAsprakInput['assignments'],
  supabase: SupabaseClient
): Promise<void> {
  for (const assignment of assignments) {
    for (const mkName of assignment.praktikumNames) {
      const praktikumId = await getOrCreatePraktikum(mkName, assignment.term, supabase);

      const { data: linkExist } = await supabase
        .from('asprak_praktikum')
        .select('id')
        .eq('id_asprak', asprakId)
        .eq('id_praktikum', praktikumId)
        .maybeSingle();

      if (!linkExist) {
        await supabase.from('asprak_praktikum').insert({
          id_asprak: asprakId,
          id_praktikum: praktikumId,
        });
      }
    }
  }
}

export async function upsertAsprak(
  input: UpsertAsprakInput,
  supabaseClient?: SupabaseClient
): Promise<string> {
  const supabase = supabaseClient || globalAdmin;
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
}

/**
 * Helper: Build upsert and insert payloads from rows
 */
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
  const supabase = supabaseClient || globalAdmin;
  const result: BulkUpsertResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  if (rows.length === 0) return result;

  try {
    const nims = rows.map((r) => r.nim);

    // Fetch existing aspraks by NIM to determine PK for upsert
    const { data: existing } = await supabase
      .from('asprak')
      .select('id, nim, role')
      .in('nim', nims);

    const existingMap = new Map((existing || []).map((e) => [`${e.nim}_${e.role}`, e.id]));

    const { upsertPayload, insertPayload, skipped } = buildUpsertPayloads(rows, existingMap);
    result.skipped = skipped;

    // 1. Process updates (upsert with IDs)
    if (upsertPayload.length > 0) {
      const { error } = await supabase.from('asprak').upsert(upsertPayload);
      if (error) {
        result.errors.push(`Bulk updates err: ${error.message}`);
      } else {
        result.updated = upsertPayload.length;
      }
    }

    // 2. Process inserts (insert without IDs)
    if (insertPayload.length > 0) {
      const { error } = await supabase.from('asprak').insert(insertPayload);
      if (error) {
        result.errors.push(`Bulk inserts err: ${error.message}`);
      } else {
        result.inserted = insertPayload.length;
      }
    }
  } catch (e: any) {
    const errMsg = e instanceof Error ? e.message : String(e);
    result.errors.push(`Process err: ${errMsg}`);
  }

  return result;
}

/**
 * Helper: Update asprak code if provided
 */
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

/**
 * Helper: Calculate which assignments to delete and insert
 */
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
  const toDelete = existingInScope.filter((a) => !newSet.has(a.id_praktikum)).map((a) => a.id);

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
  const supabase = supabaseClient || globalAdmin;

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
