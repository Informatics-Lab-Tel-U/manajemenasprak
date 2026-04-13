import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

const globalAdmin = createAdminClient();

export type ModulScheduleEntry = {
  modul: number;
  tanggal_mulai: string | null;
};

const TOTAL_MODUL = 16;

export async function getModulScheduleByTerm(
  term: string,
  supabaseClient?: SupabaseClient
): Promise<ModulScheduleEntry[]> {
  const supabase = supabaseClient || globalAdmin;

  try {
    const { data, error } = await supabase
      .from('konfigurasi_modul')
      .select('modul,tanggal_mulai')
      .eq('tahun_ajaran', term)
      .order('modul', { ascending: true });

    if (error) {
      logger.error('Error fetching modul schedule:', error);
      return buildDefaultRows();
    }

    const existingMap = new Map<number, string | null>();
    (data || []).forEach((row: any) => {
      existingMap.set(row.modul as number, row.tanggal_mulai ?? null);
    });

    const rows: ModulScheduleEntry[] = [];
    for (let i = 1; i <= TOTAL_MODUL; i += 1) {
      rows.push({
        modul: i,
        tanggal_mulai: existingMap.get(i) ?? null,
      });
    }

    return rows;
  } catch (err) {
    logger.error('Unexpected error fetching modul schedule:', err);
    return buildDefaultRows();
  }
}

export async function upsertModulScheduleForTerm(
  term: string,
  entries: ModulScheduleEntry[],
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient || globalAdmin;

  const payload = entries.map((e) => ({
    tahun_ajaran: term,
    modul: e.modul,
    tanggal_mulai: e.tanggal_mulai,
  }));

  const { error } = await supabase.from('konfigurasi_modul').upsert(payload, {
    onConflict: 'tahun_ajaran,modul',
  });

  if (error) {
    logger.error('Error upserting modul schedule:', error);
    throw new Error(`Gagal menyimpan tanggal modul: ${error.message}`);
  }
}

function buildDefaultRows(): ModulScheduleEntry[] {
  const rows: ModulScheduleEntry[] = [];
  for (let i = 1; i <= TOTAL_MODUL; i += 1) {
    rows.push({ modul: i, tanggal_mulai: null });
  }
  return rows;
}
