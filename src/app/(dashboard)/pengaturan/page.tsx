import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { getMaintenanceStatus } from '@/services/systemService.server';
import PengaturanClientPage from './PengaturanClientPage';
import PengaturanLoading from './loading';

export const dynamic = 'force-dynamic';

export default async function PengaturanPage() {
  const authUser = await requireAuth();
  let isMaintenance = false;

  try {
    isMaintenance = await getMaintenanceStatus();
  } catch (error) {
    console.error('[PengaturanPage] SSR fetch error:', error);
  }

  return (
    <Suspense fallback={<PengaturanLoading />}>
      <PengaturanClientPage initialIsMaintenance={isMaintenance} initialUserRole={authUser.pengguna.role} />
    </Suspense>
  );
}
