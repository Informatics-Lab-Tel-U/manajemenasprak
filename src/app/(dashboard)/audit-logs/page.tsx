import { requireAuth } from '@/lib/auth';
import { getAuditLogs } from '@/services/server/auditLogService';
import AuditLogsClientPage from './AuditLogsClientPage';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage(props: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const searchParams = await props.searchParams;
  const authUser = await requireAuth();

  // Security check: only ADMIN and ASLAB can access audit logs
  if (authUser.pengguna.role === 'ASPRAK_KOOR') {
    redirect('/');
  }

  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;

  const { logs, count } = await getAuditLogs(page, pageSize);

  return (
    <AuditLogsClientPage
      logs={logs}
      totalCount={count}
      currentPage={page}
      pageSize={pageSize}
    />
  );
}
