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
