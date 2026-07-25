import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { getMaintenanceStatus } from '@/services/systemService.server';
import PengaturanClientPage from './PengaturanClientPage';
import PengaturanLoading from './loading';

export default async function PengaturanPage() {
  const authUser = await requireAuth();
  const isMaintenance = await getMaintenanceStatus();

  return (
    <Suspense fallback={<PengaturanLoading />}>
      <PengaturanClientPage initialIsMaintenance={isMaintenance} initialUserRole={authUser.pengguna.role} />
    </Suspense>
  );
}
