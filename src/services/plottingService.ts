
import { supabase } from './supabase';
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

export async function getPlottingList(
  page: number,
  limit: number,
  term?: string,
  praktikumId?: string
): Promise<PlottingListResult> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('Asprak_Praktikum')
    .select(`
      id,
      asprak:Asprak!inner (
        id, kode, nama_lengkap, nim
      ),
      praktikum:Praktikum!inner (
        id, nama, tahun_ajaran
      )
    `, { count: 'exact' });

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
  term: string
): Promise<ValidationResult> {
  
  // 1. Fetch ALL Aspraks and Praktikums for lookup to minimize queries
  // Or fetch in batches. If rows are huge (1000+), fetching all codes might be better.
  // Aspraks: We need to map code -> ID(s).
  
  const { data: allAspraks } = await supabase
    .from('Asprak')
    .select('id, kode, nama_lengkap, nim, angkatan');
    
  const asprakMap = new Map<string, typeof allAspraks>();
  allAspraks?.forEach(a => {
      const existing = asprakMap.get(a.kode) || [];
      existing.push(a);
      asprakMap.set(a.kode, existing);
  });

  // Praktikums: Map name -> ID for the SPECIFIED term.
  const { data: termPraktikums } = await supabase
    .from('Praktikum')
    .select('id, nama')
    .eq('tahun_ajaran', term);
    
  const praktikumMap = new Map<string, string>(); // name -> id
  termPraktikums?.forEach(p => {
      praktikumMap.set(p.nama.toUpperCase(), p.id); // keys uppercase
  });

  const result: ValidationResult = {
    validRows: [],
    ambiguousRows: [],
    invalidRows: []
  };

  for (const row of rows) {
      const code = row.kode_asprak.trim();
      const mkName = row.mk_singkat.trim().toUpperCase();
      
      // Check Praktikum
      const praktikumId = praktikumMap.get(mkName);
      if (!praktikumId) {
          result.invalidRows.push({ original: row, reason: `Praktikum '${mkName}' not found in term ${term}` });
          continue;
      }
      
      // Check Asprak
      // If user provided selected_asprak_id (manual resolution), valid.
      if (row.selected_asprak_id) {
           result.validRows.push({ 
               asprak_id: row.selected_asprak_id, 
               praktikum_id: praktikumId,
               original: row 
           });
           continue;
      }
      
      const candidates = asprakMap.get(code); // Returns array
      
      if (!candidates || candidates.length === 0) {
          result.invalidRows.push({ original: row, reason: `Asprak code '${code}' not found` });
      } else if (candidates.length === 1) {
          result.validRows.push({ 
              asprak_id: candidates[0].id, 
              praktikum_id: praktikumId,
              original: row 
          });
      } else {
          // Ambiguous
          result.ambiguousRows.push({ 
              original: row, 
              candidates: candidates,
              reason: `Multiple aspraks found with code '${code}'`,
              praktikum_id: praktikumId
          });
      }
  }

  return result;
}

export async function savePlotting(assignments: { asprak_id: string; praktikum_id: string }[]) {
    // Insert ignoring duplicates? Or fail?
    // Supabase insert has `ignoreDuplicates` option but mostly for primary keys.
    // If unique constraint on (asprak_id, praktikum_id) exists, we catch error or ignore.
    
    // We'll process one by one or batch with error handling?
    // Batch is faster.
    
    // Transform to DB rows
    const dbRows = assignments.map(a => ({
        id_asprak: a.asprak_id,
        id_praktikum: a.praktikum_id
    }));
    
    // We must handle duplicates gracefully.
    // If we use `upsert`... there is no 'update' needed, just 'do nothing if exists'.
    // `upsert` with `onConflict` works.
    // Assuming unique constraint `asprak_praktikum_id_asprak_id_praktikum_key` or similar exists?
    // Or just simple `id_asprak, id_praktikum`.
    
    // Let's try upsert + ignore duplicates.
    // Or select existing first?
    // For large batches, select existing is expensive.
    
    const { error } = await supabase
        .from('Asprak_Praktikum')
        .upsert(dbRows, { onConflict: 'id_asprak, id_praktikum', ignoreDuplicates: true });
        
    if (error) {
        logger.error('Error saving plotting assignments:', error);
        throw new Error(error.message);
    }
}

export async function deletePlotting(id: number) {
    const { error } = await supabase.from('Asprak_Praktikum').delete().eq('id', id);
    if (error) throw new Error(error.message);
}
