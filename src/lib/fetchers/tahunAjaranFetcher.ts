import { ServiceResult } from '@/types/api';

/**
 * Fetches available academic years from the API.
 */
export async function fetchAvailableTahunAjaran(): Promise<ServiceResult<string[]>> {
  try {
    const res = await fetch('/api/tahun-ajaran');
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

