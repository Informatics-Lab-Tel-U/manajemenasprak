import 'server-only';
import { honoFetch } from '@/lib/honoClient';

export interface ModulScheduleEntry {
  modul: number;
  tanggal_mulai: string | null;
}

const TOTAL_MODUL = 16;

export async function getModulScheduleByTerm(
  term: string
): Promise<ModulScheduleEntry[]> {
  const result = await honoFetch<ModulScheduleEntry[]>(`/api/modul-schedule?term=${encodeURIComponent(term)}`);
  if (!result.ok || !result.data) {
    return buildDefaultRows();
  }
  return result.data;
}

export async function upsertModulScheduleForTerm(
  term: string,
  entries: ModulScheduleEntry[]
): Promise<void> {
  const result = await honoFetch('/api/modul-schedule', {
    method: 'POST',
    body: JSON.stringify({ term, entries }),
  });

  if (!result.ok) {
    throw new Error(result.error || 'Gagal menyimpan tanggal modul');
  }
}

function buildDefaultRows(): ModulScheduleEntry[] {
  const rows: ModulScheduleEntry[] = [];
  for (let i = 1; i <= TOTAL_MODUL; i += 1) {
    rows.push({ modul: i, tanggal_mulai: null });
  }
  return rows;
}
