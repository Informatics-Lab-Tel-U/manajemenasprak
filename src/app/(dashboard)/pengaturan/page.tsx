import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getMaintenanceStatus } from '@/services/systemService.server';
import PengaturanClientPage from './PengaturanClientPage';
import PengaturanLoading from './loading';
import type { Role } from '@/config/rbac';

export default async function PengaturanPage() {
  const [supabase, authUser] = await Promise.all([createClient(), requireAuth()]);

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
