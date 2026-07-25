import 'server-only';
import { honoFetch } from '@/lib/honoClient';

export interface DashboardStats {
  asprakCount: number;
  jadwalCount: number;
  pelanggaranCount: number;
  asprakByAngkatan: { name: string; count: number }[];
  jadwalByDay: { name: string; count: number }[];
}

export async function getStats(
  initialTerm?: string
): Promise<DashboardStats> {
  const query = initialTerm ? `?term=${encodeURIComponent(initialTerm)}` : '';
  const result = await honoFetch<DashboardStats>(`/api/stats${query}`);

  if (result.ok && result.data) {
    return result.data;
  }

  return {
    asprakCount: 0,
    jadwalCount: 0,
    pelanggaranCount: 0,
    asprakByAngkatan: [],
    jadwalByDay: [],
  };
}

export async function clearAllData(): Promise<void> {
  const result = await honoFetch('/api/clear', { method: 'POST' });
  if (!result.ok) {
    throw new Error(result.error || 'Failed to clear all data');
  }
}

export async function clearDataByTerm(term: string): Promise<void> {
  const result = await honoFetch('/api/clear-term', {
    method: 'POST',
    body: JSON.stringify({ term }),
  });
  if (!result.ok) {
    throw new Error(result.error || `Failed to clear data for term: ${term}`);
  }
}
