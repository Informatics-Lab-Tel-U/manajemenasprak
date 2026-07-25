import 'server-only';
import { LabStatus } from '@/store/useMonitoringStore';
import { honoFetch } from '@/lib/honoClient';

export async function getMonitoringLabs(): Promise<LabStatus[]> {
  const result = await honoFetch<LabStatus[]>('/api/monitoring/heartbeat');
  return result.ok && result.data ? result.data : [];
}
