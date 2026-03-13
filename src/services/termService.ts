/**
 * Term Service - Shared business logic for academic terms
 * Single source of truth for getAvailableTerms across the application
 */

import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { cache } from 'react';

// Admin Supabase client (bypasses RLS). This service is only used from API routes/server.
const globalAdmin = createAdminClient();

/**
 * Fetch all available academic terms (tahun_ajaran)
 * Returns sorted list with latest first
 */
export async function getAvailableTerms(supabaseClient?: SupabaseClient): Promise<string[]> {
  const supabase = supabaseClient || globalAdmin;
  const { data } = await supabase
    .from('praktikum')
    .select('tahun_ajaran')
    .order('tahun_ajaran', { ascending: false });

  if (!data) return [];
  return Array.from(new Set(data.map((p) => p.tahun_ajaran as string))).sort((a, b) =>
    b.localeCompare(a)
  );
}

/**
 * Cached version of getAvailableTerms
 * Deduplicates requests within a single render/request cycle
 * ReCache is transparent - same type signature as original function
 */
export const getCachedAvailableTerms = cache(
  async (supabaseClient?: SupabaseClient): Promise<string[]> => {
    return getAvailableTerms(supabaseClient);
  }
);
