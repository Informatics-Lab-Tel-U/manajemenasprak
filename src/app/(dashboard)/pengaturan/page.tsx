import { requireAuth } from '@/lib/auth';
import { getAllMaintenanceStatuses } from '@/services/systemService';
import { PengaturanClientWrapper } from './PengaturanClientWrapper';

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
    <PengaturanClientWrapper
      initialIsMaintenance={initialMaintenanceStatuses.dashboard}
      initialMaintenanceStatuses={initialMaintenanceStatuses}
      initialUserRole={authUser.pengguna.role}
    />
  );
}
