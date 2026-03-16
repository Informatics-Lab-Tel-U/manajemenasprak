import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuditLogWithUser } from '@/types/database';

const admin = createAdminClient();

/**
 * Fetch audit logs with pagination and user details
 */
export async function getAuditLogs(
  page: number = 1,
  pageSize: number = 10
): Promise<{ logs: AuditLogWithUser[]; count: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await admin
    .from('audit_log')
    .select('*, pengguna(nama_lengkap, role)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  return {
    logs: (data || []) as AuditLogWithUser[],
    count: count || 0,
  };
}
