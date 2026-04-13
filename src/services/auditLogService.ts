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

/**
 * Create a new audit log entry
 */
export async function createAuditLog(input: {
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: any;
  new_values?: any;
  id_pengguna?: string;
}) {
  const { error } = await admin.from('audit_log').insert(input);

  if (error) {
    console.error('Failed to create audit log:', error);
    // We don't throw here to avoid failing the main operation if logging fails
  }
}
