import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { Asprak } from '@/types/database';
import { logger } from '@/lib/logger';
import { checkCodeConflict, generateConflictErrorMessage } from '@/utils/conflict';
import { generateAsprakCode } from '@/utils/asprakCodeGenerator';

// Admin Supabase client (bypasses RLS). This service is only used from API routes/server.
const globalAdmin = createAdminClient();

export async function checkNimExists(nim: string, supabaseClient?: SupabaseClient): Promise<boolean> {
  const supabase = supabaseClient || globalAdmin;
  const { data } = await supabase
    .from('asprak')
    .select('id')
    .eq('nim', nim)
    .maybeSingle();
  return !!data;
}

export async function generateUniqueCode(nama: string, supabaseClient?: SupabaseClient): Promise<{ code: string; rule: string }> {
  const supabase = supabaseClient || globalAdmin;
  // Fetch ALL existing codes to ensure uniqueness
  const existingCodes = await getExistingCodes(supabase);
  const usedCodesSet = new Set(existingCodes);

  try {
    const result = generateAsprakCode(nama, usedCodesSet);
    return result;
  } catch (error: any) {
    // If generation fails, return empty
    return { code: '', rule: 'Manual Input Required' };
  }
}

export async function getAllAsprak(term?: string, supabaseClient?: SupabaseClient): Promise<Asprak[]> {
  const supabase = supabaseClient || globalAdmin;
  let query;

  if (term) {
    // If term is provided, filter by term using inner join
    // This returns Aspraks who have at least one assignment in the specified term
    query = supabase
      .from('asprak')
      .select('*, asprak_praktikum!inner(praktikum!inner(tahun_ajaran))')
      .eq('asprak_praktikum.praktikum.tahun_ajaran', term)
      .order('nim', { ascending: true });
  } else {
    // Default: fetch all
    query = supabase.from('asprak').select('*').order('nim', { ascending: true });
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching asprak:', error);
    throw new Error(`Failed to fetch asprak: ${error.message}`);
  }
  
  // Clean up the result to match Asprak type (remove the joined tables)
  return (data || []).map((item: any) => ({
    id: item.id,
    nama_lengkap: item.nama_lengkap,
    nim: item.nim,
    kode: item.kode,
    angkatan: item.angkatan,
    created_at: item.created_at,
  })) as Asprak[];
}

export interface AsprakWithMap extends Asprak {
    assignments: {
        id: string; // Praktikum ID
        nama: string;
        tahun_ajaran: string;
    }[];
}

export async function getAspraksWithAssignments(term?: string, supabaseClient?: SupabaseClient): Promise<AsprakWithMap[]> {
  const supabase = supabaseClient || globalAdmin;
  let query = supabase
    .from('asprak')
    .select(`
        *,
        asprak_praktikum (
            praktikum (
                id,
                nama,
                tahun_ajaran
            )
        )
    `)
    .order('nim', { ascending: true });

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching plotting data:', error);
    throw new Error(`Failed to fetch plotting data: ${error.message}`);
  }

  const result: AsprakWithMap[] = (data || []).map((item: any) => {
      const allAssignments = (item.asprak_praktikum || [])
        .map((ap: any) => ap.praktikum)
        .filter((p: any) => !!p); // Filter nulls if any
      
      const filteredAssignments = term && term !== 'all' 
          ? allAssignments.filter((p: any) => p.tahun_ajaran === term)
          : allAssignments;

      return {
          id: item.id,
          nama_lengkap: item.nama_lengkap,
          nim: item.nim,
          kode: item.kode,
          angkatan: item.angkatan,
          created_at: item.created_at,
          updated_at: item.updated_at,
          assignments: filteredAssignments
      };
  });
  
  if (term && term !== 'all') {
      return result.filter(r => r.assignments.length > 0);
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
  return Array.from(new Set(data.map((d) => d.kode))).sort();
}

export async function getAvailableTerms(supabaseClient?: SupabaseClient): Promise<string[]> {
  const supabase = supabaseClient || globalAdmin;
  const { data } = await supabase
    .from('praktikum')
    .select('tahun_ajaran')
    .order('tahun_ajaran', { ascending: false });

  if (!data) return [];
  return Array.from(new Set(data.map((p) => p.tahun_ajaran)))
    .sort()
    .reverse();
}

export async function getAsprakAssignments(asprakId: number | string, supabaseClient?: SupabaseClient) {
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
  angkatan: number;
  assignments: {
      term: string;
      praktikumNames: string[];
  }[];
}

export async function upsertAsprak(input: UpsertAsprakInput, supabaseClient?: SupabaseClient): Promise<string> {
  const supabase = supabaseClient || globalAdmin;
  let angkatan = input.angkatan;
  if (angkatan < 100) angkatan += 2000;

  const { data: codeOwner } = await supabase
    .from('asprak')
    .select('*')
    .eq('kode', input.kode)
    .maybeSingle();

  const conflictCheck = checkCodeConflict(codeOwner, input.nim);
  if (conflictCheck.hasConflict && conflictCheck.existingOwner) {
    throw new Error(generateConflictErrorMessage(input.kode, conflictCheck.existingOwner));
  }

  let asprakId = '';
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
        angkatan: angkatan,
      })
      .eq('id', existingUser.id);

    if (upError) throw upError;
    asprakId = existingUser.id;
  } else {
    if (codeOwner && codeOwner.nim !== input.nim) {
      await supabase
        .from('asprak')
        .update({
          kode: `${codeOwner.kode}_EXPIRED_${codeOwner.id.substring(0, 4)}`,
        })
        .eq('id', codeOwner.id);
    }

    const { data: newUser, error: inError } = await supabase
      .from('asprak')
      .insert({
        nim: input.nim,
        nama_lengkap: input.nama_lengkap,
        kode: input.kode,
        angkatan: angkatan,
      })
      .select()
      .single();

    if (inError) throw inError;
    asprakId = newUser.id;
  }

  // Iterate over assignment blocks
  for (const assignment of input.assignments) {
      for (const mkName of assignment.praktikumNames) {
        let praktikumId = '';
        const { data: pExist } = await supabase
          .from('praktikum')
          .select('id')
          .eq('nama', mkName)
          .eq('tahun_ajaran', assignment.term)
          .maybeSingle();

        if (pExist) {
          praktikumId = pExist.id;
        } else {
          const { data: pNew, error: pError } = await supabase
            .from('praktikum')
            .insert({ nama: mkName, tahun_ajaran: assignment.term })
            .select()
            .single();
          if (pError) throw pError;
          praktikumId = pNew.id;
        }

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

  return asprakId;
}

export interface BulkUpsertRow {
  nim: string;
  nama_lengkap: string;
  kode: string;
  angkatan: number;
}

export interface BulkUpsertResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export async function bulkUpsertAspraks(rows: BulkUpsertRow[], supabaseClient?: SupabaseClient): Promise<BulkUpsertResult> {
  const supabase = supabaseClient || globalAdmin;
  const result: BulkUpsertResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (const row of rows) {
    try {
      let angkatan = row.angkatan;
      if (angkatan > 0 && angkatan < 100) angkatan += 2000;

      // Check if asprak already exists by NIM
      const { data: existing } = await supabase
        .from('asprak')
        .select('id, kode')
        .eq('nim', row.nim)
        .maybeSingle();

      if (existing) {
        // Update existing asprak
        const { error: upError } = await supabase
          .from('asprak')
          .update({
            nama_lengkap: row.nama_lengkap,
            kode: row.kode,
            angkatan: angkatan,
          })
          .eq('id', existing.id);

        if (upError) {
          result.errors.push(`Update ${row.nim}: ${upError.message}`);
          result.skipped++;
        } else {
          result.updated++;
        }
      } else {
        // Insert new asprak
        const { error: inError } = await supabase
          .from('asprak')
          .insert({
            nim: row.nim,
            nama_lengkap: row.nama_lengkap,
            kode: row.kode,
            angkatan: angkatan,
          });

        if (inError) {
          result.errors.push(`Insert ${row.nim}: ${inError.message}`);
          result.skipped++;
        } else {
          result.inserted++;
        }
      }
    } catch (e: any) {
      result.errors.push(`${row.nim}: ${e.message}`);
      result.skipped++;
    }
  }

  return result;
}

export async function updateAsprakAssignments(
  asprakId: number | string,
  term: string,
  praktikumIds: string[],
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient || globalAdmin;
  // Get ALL existing assignments first
  const { data: existingAll } = await supabase
    .from('asprak_praktikum')
    .select('id, id_praktikum')
    .eq('id_asprak', asprakId);

  const allExisting = existingAll || [];
  let existingInScope = allExisting;

  // Filter scope if term is specific
  if (term && term !== 'all') {
    const { data: termPraktikums } = await supabase
      .from('praktikum')
      .select('id')
      .eq('tahun_ajaran', term);

    if (termPraktikums) {
      const termPids = new Set(termPraktikums.map((p) => p.id));
      existingInScope = allExisting.filter((a) => termPids.has(a.id_praktikum));
    }
  }

  // Determine what to delete (items in scope that are NOT in the new list)
  const newSet = new Set(praktikumIds);
  const toDelete = existingInScope
    .filter((a) => !newSet.has(a.id_praktikum))
    .map((a) => a.id);

  // Determine what to insert (items in new list that are NOT in existing scope)
  // And filter against ALL existing to avoid duplicates (unique constraint safety)
  const existingAllPids = new Set(allExisting.map((a) => a.id_praktikum));
  const toInsert = praktikumIds.filter((pid) => !existingAllPids.has(pid));

  if (toDelete.length > 0) {
    const { error: delError } = await supabase
      .from('asprak_praktikum')
      .delete()
      .in('id', toDelete);
    if (delError) {
      throw new Error(`Delete failed: ${delError.message}`);
    }
  }

  if (toInsert.length > 0) {
    const rows = toInsert.map((pid) => ({
      id_asprak: asprakId,
      id_praktikum: pid,
    }));

    const { error: insError } = await supabase
      .from('asprak_praktikum')
      .insert(rows);

    if (insError) {
      throw new Error(`Insert failed: ${insError.message}`);
    }
  }
}
