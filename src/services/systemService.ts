import 'server-only';
import { honoFetch } from '@/lib/honoClient';

export interface MaintenanceStatuses {
  dashboard: boolean;
  informaticsweb: boolean;
  generator_kursi: boolean;
}

export async function getMaintenanceStatus(): Promise<boolean> {
  const result = await honoFetch<{ active?: boolean; maintenance?: boolean }>('/api/system/maintenance');
  return result.ok && result.data ? !!(result.data.active ?? result.data.maintenance) : false;
}

export async function getAllMaintenanceStatuses(): Promise<MaintenanceStatuses> {
  const result = await honoFetch<{ statuses: MaintenanceStatuses }>('/api/system/maintenance?app=all');
  if (result.ok && result.data && result.data.statuses) {
    return result.data.statuses;
  }
  return { dashboard: false, informaticsweb: false, generator_kursi: false };
}

export async function setMaintenanceStatus(active: boolean, userId: string, app: string = 'dashboard'): Promise<void> {
  const result = await honoFetch('/api/system/maintenance', {
    method: 'POST',
    body: JSON.stringify({ active, userId, app }),
  });

  if (!result.ok) {
    throw new Error(result.error || 'Gagal mengubah status maintenance');
  }
}
