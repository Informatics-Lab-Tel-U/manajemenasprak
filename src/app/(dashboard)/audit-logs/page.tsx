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

  const [authUser, { logs, count }] = await Promise.all([
    requireAuth(),
    getAuditLogs(page, pageSize),
  ]);

  // Security check: only ADMIN and ASLAB can access audit logs
  if (authUser.pengguna.role === 'ASPRAK_KOOR') {
    redirect('/');
  }

  return (
    <AuditLogsClientPage logs={logs} totalCount={count} currentPage={page} pageSize={pageSize} />
  );
}
