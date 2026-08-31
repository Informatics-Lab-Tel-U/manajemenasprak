'use client';

import dynamic from 'next/dynamic';
import type { Role } from '@/config/rbac';
import PengaturanLoading from './loading';

interface Props {
  initialIsMaintenance: boolean;
  initialMaintenanceStatuses: { dashboard: boolean; informaticsweb: boolean; generator_kursi: boolean };
  initialUserRole: Role | null;
}

const PengaturanClientPage = dynamic(() => import('./PengaturanClientPage'), {
  ssr: false,
  loading: () => <PengaturanLoading />,
});

export function PengaturanClientWrapper(props: Props) {
  return <PengaturanClientPage {...props} />;
}
