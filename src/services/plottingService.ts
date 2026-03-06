import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export interface PlottingItem {
  id: number; // Asprak_Praktikum ID
  asprak: {
    id: string;
    kode: string;
    nama_lengkap: string;
    nim: string;
  };
  praktikum: {
    id: string;
    nama: string;
    tahun_ajaran: string;
  };
}

export interface PlottingListResult {
  data: PlottingItem[];
  total: number;
}

// Admin Supabase client (bypasses RLS). This service is only used from API routes/server.
const globalAdmin = createAdminClient();

export async function getPlottingList(
  page: number,
  limit: number,
  term?: string,
  praktikumId?: string,
  supabaseClient?: SupabaseClient
): Promise<PlottingListResult> {
  const supabase = supabaseClient || globalAdmin;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from('asprak_praktikum').select(
    `
      id,
      asprak:asprak!inner (
        id, kode, nama_lengkap, nim
      ),
      praktikum:praktikum!inner (
        id, nama, tahun_ajaran
      )
    `,
    { count: 'exact' }
  );

  // Apply filters
  if (term && term !== 'all') {
    query = query.eq('praktikum.tahun_ajaran', term);
  }

  if (praktikumId && praktikumId !== 'all') {
    query = query.eq('id_praktikum', praktikumId);
  }

  // Sort by Asprak Code then Praktikum Name
  // Note: Sorting on joined columns can be tricky with Supabase JS client depending on version.
  // Usually we sort on main table or joined table with specific syntax.
  // For now let's just paginate. Sorting might be default or need special handling.

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    logger.error('Error fetching plotting list:', error);
    throw new Error(error.message);
  }

  return {
    data: (data || []) as unknown as PlottingItem[],
    total: count || 0,
  };
}

export interface ValidatePlottingRow {
  kode_asprak: string;
  mk_singkat: string;
  selected_asprak_id?: string; // If user resolves ambiguity
}

export interface ValidationResult {
  validRows: { asprak_id: string; praktikum_id: string; original: ValidatePlottingRow }[];
  ambiguousRows: {
    original: ValidatePlottingRow;
    candidates: { id: string; nama_lengkap: string; nim: string; angkatan: number }[];
    reason: string;
    praktikum_id: string;
  }[];
  invalidRows: { original: ValidatePlottingRow; reason: string }[];
}

export async function validatePlottingImport(
  rows: ValidatePlottingRow[],
  term: string,
  supabaseClient?: SupabaseClient
): Promise<ValidationResult> {
  const supabase = supabaseClient || globalAdmin;

  // 1. Fetch ALL Aspraks and Praktikums for lookup to minimize queries
  // Or fetch in batches. If rows are huge (1000+), fetching all codes might be better.
  // Aspraks: We need to map code -> ID(s).

  const { data: allAspraks } = await supabase
    .from('asprak')
    .select('id, kode, nama_lengkap, nim, angkatan');

  const asprakMap = new Map<string, typeof allAspraks>();
  allAspraks?.forEach((a) => {
    const existing = asprakMap.get(a.kode) || [];
    existing.push(a);
    asprakMap.set(a.kode, existing);
  });

  // Praktikums: Map name -> ID for the SPECIFIED term.
  const { data: termPraktikums } = await supabase
    .from('praktikum')
    .select('id, nama')
    .eq('tahun_ajaran', term);

  const praktikumMap = new Map<string, string>(); // name -> id
  termPraktikums?.forEach((p) => {
    praktikumMap.set(p.nama.toUpperCase(), p.id); // keys uppercase
  });

  const praktikumIds = Array.from(praktikumMap.values());
  const existingAssignments = new Set<string>();
  if (praktikumIds.length > 0) {
     const { data: existingPlotting } = await supabase
       .from('asprak_praktikum')
       .select('id_asprak, id_praktikum')
       .in('id_praktikum', praktikumIds);
       
     existingPlotting?.forEach(p => {
         existingAssignments.add(`${p.id_asprak}_${p.id_praktikum}`);
     });
  }

  const result: ValidationResult = {
    validRows: [],
    ambiguousRows: [],
    invalidRows: [],
  };

  for (const row of rows) {
    const code = row.kode_asprak.trim();
    const mkName = row.mk_singkat.trim().toUpperCase();

    // Check Praktikum
    const praktikumId = praktikumMap.get(mkName);
    if (!praktikumId) {
      result.invalidRows.push({
        original: row,
        reason: `Praktikum '${mkName}' not found in term ${term}`,
      });
      continue;
    }

    // Check Asprak
    // If user provided selected_asprak_id (manual resolution), valid.
    if (row.selected_asprak_id) {
      if (existingAssignments.has(`${row.selected_asprak_id}_${praktikumId}`)) {
         result.invalidRows.push({ original: row, reason: `Sudah terdaftar di Praktikum ini` });
      } else {
         result.validRows.push({
           asprak_id: row.selected_asprak_id,
           praktikum_id: praktikumId,
           original: row,
         });
      }
      continue;
    }

    const candidates = asprakMap.get(code); // Returns array

    if (!candidates || candidates.length === 0) {
      result.invalidRows.push({ original: row, reason: `Asprak code '${code}' not found` });
    } else if (candidates.length === 1) {
      const asprakId = candidates[0].id;
      if (existingAssignments.has(`${asprakId}_${praktikumId}`)) {
         result.invalidRows.push({ original: row, reason: `Sudah terdaftar di Praktikum ini` });
      } else {
         result.validRows.push({
           asprak_id: asprakId,
           praktikum_id: praktikumId,
           original: row,
         });
      }
    } else {
      // Ambiguous
      // Filter out candidates that are already registered
      const availableCandidates = candidates.filter(c => !existingAssignments.has(`${c.id}_${praktikumId}`));
      
      if (availableCandidates.length === 0) {
         result.invalidRows.push({ original: row, reason: `Semua kandidat untuk kode '${code}' sudah terdaftar di Praktikum ini` });
      } else if (availableCandidates.length === 1) {
         result.validRows.push({
           asprak_id: availableCandidates[0].id,
           praktikum_id: praktikumId,
           original: row,
         });
      } else {
         result.ambiguousRows.push({
           original: row,
           candidates: availableCandidates,
           reason: `Multiple aspraks found with code '${code}'`,
           praktikum_id: praktikumId,
         });
      }
    }
  }

  return result;
}

export async function savePlotting(
  assignments: { asprak_id: string; praktikum_id: string }[],
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || globalAdmin;

  if (!assignments || assignments.length === 0) return;

  // Transform to DB rows and ensure uniqueness in the payload itself
  const uniqueAssignments = new Map<string, { id_asprak: string; id_praktikum: string }>();
  assignments.forEach((a) => {
    uniqueAssignments.set(`${a.asprak_id}_${a.praktikum_id}`, {
      id_asprak: a.asprak_id,
      id_praktikum: a.praktikum_id,
    });
  });
  const payloadRows = Array.from(uniqueAssignments.values());

  // Fetch existing mappings to avoid duplicate insertions
  const asprakIds = Array.from(new Set(payloadRows.map((row) => row.id_asprak)));

  // Batch fetch existing assignments if necessary
  const { data: existing, error: fetchError } = await supabase
    .from('asprak_praktikum')
    .select('id_asprak, id_praktikum')
    .in('id_asprak', asprakIds);

  if (fetchError) {
    logger.error('Error fetching existing plotting assignments:', fetchError);
    throw new Error(fetchError.message);
  }

  const existingSet = new Set((existing || []).map((e) => `${e.id_asprak}_${e.id_praktikum}`));

  // Filter out rows that already exist in the database
  const toInsert = payloadRows.filter(
    (row) => !existingSet.has(`${row.id_asprak}_${row.id_praktikum}`)
  );

  if (toInsert.length > 0) {
    const { error } = await supabase.from('asprak_praktikum').insert(toInsert);

    if (error) {
      logger.error('Error saving plotting assignments:', error);
      throw new Error(error.message);
    }
  }
}

export async function deletePlotting(id: number, supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || globalAdmin;
  const { error } = await supabase.from('asprak_praktikum').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
