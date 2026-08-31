import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { getAvailableTerms } from '@/services/termService';
import { getMataKuliahByTerm } from '@/services/mataKuliahService';
import { getPraktikumByTerm, getUniquePraktikumNames } from '@/services/praktikumService';
import MataKuliahClientPage from './MataKuliahClientPage';
import MataKuliahLoading from './loading';

export const dynamic = 'force-dynamic';

export default async function MataKuliahPage() {
  await requireAuth();

  let terms: string[] = [];
  let praktikumNames: any[] = [];
  let initialGroupedData: any[] = [];
  let initialValidPraktikums: any[] = [];

  try {
    const [termsRes, pNamesRes, mkRes, pRes] = await Promise.all([
      getAvailableTerms(),
      getUniquePraktikumNames(),
      getMataKuliahByTerm('all'),
      getPraktikumByTerm('all'),
    ]);
    terms = termsRes || [];
    praktikumNames = pNamesRes || [];
    initialGroupedData = mkRes || [];
    initialValidPraktikums = pRes || [];
  } catch (error) {
    console.error('[MataKuliahPage] SSR fetch error:', error);
  }

  return (
    <Suspense fallback={<MataKuliahLoading />}>
      <MataKuliahClientPage
        initialGroupedData={initialGroupedData}
        initialValidPraktikums={initialValidPraktikums}
        initialTerms={terms}
        initialPraktikumNames={praktikumNames}
      />
    </Suspense>
  );
}
