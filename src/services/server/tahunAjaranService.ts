import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

/**
 * Fetches all unique academic years (tahun_ajaran) from the praktikum table.
 * Results are ordered descending.
 */
export async function getAvailableTahunAjaran() {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('praktikum')
    .select('tahun_ajaran')
    .order('tahun_ajaran', { ascending: false });

  if (error) {
    logger.error('Error fetching available tahun ajaran:', error);
    return [];
  }

  if (!data) return [];

  // Extract unique values
  const uniqueTahunAjaran = Array.from(new Set(data.map((p: any) => p.tahun_ajaran)));
  
  return uniqueTahunAjaran;
}
