import 'server-only';
import { AuditLogWithUser } from '@/types/database';
import { honoFetch } from '@/lib/honoClient';

export async function getAuditLogs(
  page: number = 1,
  pageSize: number = 10
): Promise<{ logs: AuditLogWithUser[]; count: number }> {
  const result = await honoFetch<{ logs: AuditLogWithUser[]; count: number }>(
    `/api/system/audit-logs?page=${page}&pageSize=${pageSize}`
  );

  if (!result.ok || !result.data) {
    throw new Error(result.error || 'Failed to fetch audit logs');
  }

  return result.data;
}
