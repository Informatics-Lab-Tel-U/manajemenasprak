import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { Praktikan } from '@/types/database';

const globalAdmin = createAdminClient();

export interface PraktikanListResponse {
  data: Omit<Praktikan, 'id'>[];
}

export async function GetAllPraktikanList(
  kelas?: string,
  mata_kuliah?: string
): PraktikanListResponse {
  const supabase = globalAdmin || SupabaseClient;

  let query = supabase.from('praktikan').select('nama, kelas, kode_asprak, mata_kuliah');

  if (kelas) {
    query = query.eq('kelas', kelas);
  }

  if (mata_kuliah) {
    query = query.eq('mata_kuliah', mata_kuliah);
  }

  const { data, count, error } = await query;

  if (error) {
    logger.error('Error fetching praktikan data');
      return {
        data: []
    };
  }
}
