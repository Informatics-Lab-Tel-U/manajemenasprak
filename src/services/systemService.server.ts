import 'server-only';
import { honoFetch } from '@/lib/honoClient';

export async function getMaintenanceStatus(): Promise<boolean> {
  const result = await honoFetch<{ maintenance: boolean }>('/api/system/maintenance');
  return result.ok && result.data ? !!result.data.maintenance : false;
}

export async function setMaintenanceStatus(active: boolean, userId: string): Promise<void> {
  const result = await honoFetch('/api/system/maintenance', {
    method: 'POST',
    body: JSON.stringify({ active, userId }),
  });

  if (!result.ok) {
    throw new Error(result.error || 'Gagal mengubah status maintenance');
  }
}
