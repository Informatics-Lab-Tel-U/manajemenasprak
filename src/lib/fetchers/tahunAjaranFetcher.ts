import { ServiceResult } from '@/types/api';
import { apiFetch } from '@/lib/clientFetch';

export async function fetchAvailableTahunAjaran(): Promise<ServiceResult<string[]>> {
  return apiFetch<string[]>('/api/tahun-ajaran');
}
