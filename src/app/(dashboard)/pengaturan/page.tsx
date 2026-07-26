import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { getAllMaintenanceStatuses } from '@/services/systemService.server';
import PengaturanClientPage from './PengaturanClientPage';
import PengaturanLoading from './loading';

export const dynamic = 'force-dynamic';

export default async function PengaturanPage() {
  const authUser = await requireAuth();
  let initialMaintenanceStatuses = { dashboard: false, informaticsweb: false, generator_kursi: false };

  try {
    initialMaintenanceStatuses = await getAllMaintenanceStatuses();
  } catch (error) {
    console.error('[PengaturanPage] SSR fetch error:', error);
  }

  return (
    <Suspense fallback={<PengaturanLoading />}>
      <PengaturanClientPage
        initialIsMaintenance={initialMaintenanceStatuses.dashboard}
        initialMaintenanceStatuses={initialMaintenanceStatuses}
        initialUserRole={authUser.pengguna.role}
      />
    </Suspense>
  );
}
