import { createClient } from '@/lib/supabase/server';
import { AuditLogWithUser } from '@/types/database';

export async function getAuditLogs(
  page: number = 1,
  pageSize: number = 10
): Promise<{ logs: AuditLogWithUser[]; count: number }> {
  const supabase = await createClient();

  // Calculate range for pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('audit_log')
    .select(
      `
      *,
      pengguna:pengguna (
        nama_lengkap,
        role
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return { logs: [], count: 0 };
  }

  return {
    logs: (data || []) as AuditLogWithUser[],
    count: count || 0,
  };
}

export async function createAuditLog(
  tableName: string,
  recordId: string,
  operation: string,
  newValues?: any,
  oldValues?: any
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.warn(`Attempted to create audit log without user context for table ${tableName}`);
    return;
  }

  const { error } = await supabase.from('audit_log').insert({
    table_name: tableName,
    record_id: recordId,
    operation,
    new_values: newValues,
    old_values: oldValues,
    id_pengguna: user.id,
  });

  if (error) {
    console.error(`Failed to create audit log for ${tableName}:`, error);
  }
}
