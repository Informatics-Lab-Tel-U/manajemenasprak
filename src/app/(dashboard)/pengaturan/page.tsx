import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getMaintenanceStatus } from '@/services/systemService';
import PengaturanClientPage from './PengaturanClientPage';
import PengaturanLoading from './loading';
import type { Role } from '@/config/rbac';

export default async function PengaturanPage() {
  const supabase = await createClient();
  const authUser = await requireAuth();

  // Parallelize initial check
  const [profileResult, isMaintenance] = await Promise.all([
    supabase.from('pengguna').select('role').eq('id', authUser.id).single(),
    getMaintenanceStatus(),
  ]);

  const userRole = profileResult.data?.role as Role | null;

  return (
    <Suspense fallback={<PengaturanLoading />}>
      <PengaturanClientPage initialIsMaintenance={isMaintenance} initialUserRole={userRole} />
    </Suspense>
  );
}
