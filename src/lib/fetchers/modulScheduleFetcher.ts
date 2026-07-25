import type { ServiceResult } from '@/types/api';
import { apiFetch } from '@/lib/clientFetch';

export type ModulScheduleEntryDto = {
  modul: number;
  tanggal_mulai: string | null;
};

export async function fetchModulSchedule(
  term: string
): Promise<ServiceResult<ModulScheduleEntryDto[]>> {
  return apiFetch<ModulScheduleEntryDto[]>('/api/modul-schedule', {
    params: { term },
    cache: 'no-store',
  });
}

export async function saveModulSchedule(
  term: string,
  entries: ModulScheduleEntryDto[]
): Promise<ServiceResult<null>> {
  return apiFetch<null>('/api/modul-schedule', {
    method: 'POST',
    body: JSON.stringify({ term, entries }),
  });
}
