import { ServiceResult } from '@/types/api';
import { apiFetch } from '@/lib/clientFetch';

/**
 * Fetches available academic years from the API.
 */
export async function fetchAvailableTahunAjaran(): Promise<ServiceResult<string[]>> {
  return apiFetch<string[]>('/api/tahun-ajaran');
}
