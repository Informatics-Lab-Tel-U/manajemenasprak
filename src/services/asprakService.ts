/**
 * Asprak Service (Server-only)
 * Direct Supabase access - DO NOT use in client components
 */

import { supabase } from './supabase';
import { Asprak } from '@/types/database';
import { logger } from '@/lib/logger';
import { checkCodeConflict, generateConflictErrorMessage } from '@/utils/conflict';

export async function getAllAsprak(term?: string): Promise<Asprak[]> {
  let query;

  if (term) {
    // If term is provided, filter by term using inner join
    // This returns Aspraks who have at least one assignment in the specified term
    query = supabase
      .from('Asprak')
      .select('*, Asprak_Praktikum!inner(Praktikum!inner(tahun_ajaran))')
      .eq('Asprak_Praktikum.Praktikum.tahun_ajaran', term)
      .order('nim', { ascending: true });
  } else {
    // Default: fetch all
    query = supabase.from('Asprak').select('*').order('nim', { ascending: true });
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching asprak:', error);
    throw new Error(`Failed to fetch asprak: ${error.message}`);
  }
  
  // Clean up the result to match Asprak type (remove the joined tables)
  // We can just cast it, but explicit mapping is safer if we want to be strict
  return data.map((item: any) => ({
    id: item.id,
    nama_lengkap: item.nama_lengkap,
    nim: item.nim,
    kode: item.kode,
    angkatan: item.angkatan,
    created_at: item.created_at,
  })) as Asprak[];
}

export async function getExistingCodes(): Promise<string[]> {
  const { data } = await supabase.from('Asprak').select('kode');
  if (!data) return [];
  return Array.from(new Set(data.map((d) => d.kode))).sort();
}

export async function getAvailableTerms(): Promise<string[]> {
  const { data } = await supabase
    .from('Praktikum')
    .select('tahun_ajaran')
    .order('tahun_ajaran', { ascending: false });

  if (!data) return [];
  return Array.from(new Set(data.map((p) => p.tahun_ajaran)))
    .sort()
    .reverse();
}

export async function getAsprakAssignments(asprakId: number | string) {
  const { data, error } = await supabase
    .from('Asprak_Praktikum')
    .select(
      `
            id,
            praktikum:Praktikum (
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
  term: string;
  praktikumNames: string[];
}

export async function upsertAsprak(input: UpsertAsprakInput): Promise<string> {
  let angkatan = input.angkatan;
  if (angkatan < 100) angkatan += 2000;

  const { data: codeOwner } = await supabase
    .from('Asprak')
    .select('*')
    .eq('kode', input.kode)
    .maybeSingle();

  const conflictCheck = checkCodeConflict(codeOwner, input.nim);
  if (conflictCheck.hasConflict && conflictCheck.existingOwner) {
    throw new Error(generateConflictErrorMessage(input.kode, conflictCheck.existingOwner));
  }

  let asprakId = '';
  const { data: existingUser } = await supabase
    .from('Asprak')
    .select('id')
    .eq('nim', input.nim)
    .maybeSingle();

  if (existingUser) {
    const { error: upError } = await supabase
      .from('Asprak')
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
        .from('Asprak')
        .update({
          kode: `${codeOwner.kode}_EXPIRED_${codeOwner.id.substring(0, 4)}`,
        })
        .eq('id', codeOwner.id);
    }

    const { data: newUser, error: inError } = await supabase
      .from('Asprak')
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

  for (const mkName of input.praktikumNames) {
    let praktikumId = '';
    const { data: pExist } = await supabase
      .from('Praktikum')
      .select('id')
      .eq('nama', mkName)
      .eq('tahun_ajaran', input.term)
      .maybeSingle();

    if (pExist) {
      praktikumId = pExist.id;
    } else {
      const { data: pNew, error: pError } = await supabase
        .from('Praktikum')
        .insert({ nama: mkName, tahun_ajaran: input.term })
        .select()
        .single();
      if (pError) throw pError;
      praktikumId = pNew.id;
    }

    const { data: linkExist } = await supabase
      .from('Asprak_Praktikum')
      .select('id')
      .eq('id_asprak', asprakId)
      .eq('id_praktikum', praktikumId)
      .maybeSingle();

    if (!linkExist) {
      await supabase.from('Asprak_Praktikum').insert({
        id_asprak: asprakId,
        id_praktikum: praktikumId,
      });
    }
  }

  return asprakId;
}

/**
 * Bulk upsert multiple aspraks (used by CSV import).
 * Only inserts/updates Asprak records — does NOT create Praktikum links.
 *
 * @param rows - Array of { nim, nama_lengkap, kode, angkatan }
 * @returns Summary with count of inserted, updated, and skipped rows
 */
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

export async function bulkUpsertAspraks(rows: BulkUpsertRow[]): Promise<BulkUpsertResult> {
  const result: BulkUpsertResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (const row of rows) {
    try {
      let angkatan = row.angkatan;
      if (angkatan > 0 && angkatan < 100) angkatan += 2000;

      // Check if asprak already exists by NIM
      const { data: existing } = await supabase
        .from('Asprak')
        .select('id, kode')
        .eq('nim', row.nim)
        .maybeSingle();

      if (existing) {
        // Update existing asprak
        const { error: upError } = await supabase
          .from('Asprak')
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
          .from('Asprak')
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
