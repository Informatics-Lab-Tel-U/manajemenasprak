import { requireAuth } from '@/lib/auth';
import { getAuditLogs } from '@/services/auditLogService';
import AuditLogsClientPage from './AuditLogsClientPage';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage(props: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;

  const authUser = await requireAuth();

  // Security check: only ADMIN and ASLAB can access audit logs
  if (authUser.pengguna.role === 'ASPRAK_KOOR') {
    redirect('/');
  }

  let logs: any[] = [];
  let count = 0;

  try {
    const res = await getAuditLogs(page, pageSize);
    logs = res.logs || [];
    count = res.count || 0;
  } catch (error) {
    console.error('Failed to fetch audit logs in AuditLogsPage:', error);
  }

  return (
    <AuditLogsClientPage logs={logs} totalCount={count} currentPage={page} pageSize={pageSize} />
  );
}
