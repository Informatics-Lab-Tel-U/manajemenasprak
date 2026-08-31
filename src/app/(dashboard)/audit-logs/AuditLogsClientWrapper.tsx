'use client';

import dynamic from 'next/dynamic';
import type { AuditLogWithUser } from '@/types/database';
import AuditLogsLoading from './loading';

interface Props {
  logs: AuditLogWithUser[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

const AuditLogsClientPage = dynamic(() => import('./AuditLogsClientPage'), {
  ssr: false,
  loading: () => <AuditLogsLoading />,
});

export function AuditLogsClientWrapper(props: Props) {
  return <AuditLogsClientPage {...props} />;
}
