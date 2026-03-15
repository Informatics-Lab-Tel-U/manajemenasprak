import type { ServiceResult } from '@/types/api';

export type ModulScheduleEntryDto = {
  modul: number;
  tanggal_mulai: string | null;
};

export async function fetchModulSchedule(
  term: string
): Promise<ServiceResult<ModulScheduleEntryDto[]>> {
  try {
    const res = await fetch(`/api/modul-schedule?term=${encodeURIComponent(term)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function saveModulSchedule(
  term: string,
  entries: ModulScheduleEntryDto[]
): Promise<ServiceResult<null>> {
  try {
    const res = await fetch('/api/modul-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term, entries }),
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

