import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

export async function getAvailableTerms(supabaseClient?: SupabaseClient): Promise<string[]> {
  const supabase = supabaseClient ?? await createClient();
  const { data } = await supabase
    .from('praktikum')
    .select('tahun_ajaran')
    .order('tahun_ajaran', { ascending: false });

  if (!data) return [];
  return Array.from(new Set(data.map((p) => p.tahun_ajaran as string))).sort((a, b) =>
    b.localeCompare(a)
  );
}

export const getCachedAvailableTerms = cache(
  async (supabaseClient?: SupabaseClient): Promise<string[]> => {
    return getAvailableTerms(supabaseClient);
  }
);
