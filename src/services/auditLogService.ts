import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuditLogWithUser } from '@/types/database';

export async function getAuditLogs(
  page: number = 1,
  pageSize: number = 10
): Promise<{ logs: AuditLogWithUser[]; count: number }> {
  const admin = createAdminClient();
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

export async function createAuditLog(params: {
  table_name: string;
  record_id: string | number;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
}): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin.from('audit_log').insert({
    table_name: params.table_name,
    record_id: String(params.record_id),
    operation: params.operation,
    old_values: params.old_values ?? null,
    new_values: params.new_values ?? null,
  });

  if (error) {
    console.error('Failed to create audit log:', error);
  }
}
