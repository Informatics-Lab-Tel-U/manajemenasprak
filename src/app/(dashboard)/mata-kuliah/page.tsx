import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { getAvailableTerms } from '@/services/asprakService';
import { getMataKuliahByTerm } from '@/services/mataKuliahService';
import { getPraktikumByTerm, getUniquePraktikumNames } from '@/services/praktikumService';
import MataKuliahClientPage from './MataKuliahClientPage';
import MataKuliahLoading from './loading';

export default async function MataKuliahPage() {
  await requireAuth();

  // Parallelize initial data fetching
  const [terms, praktikumNames] = await Promise.all([
    getAvailableTerms(),
    getUniquePraktikumNames(),
  ]);

  const selectedTerm = terms[0] || 'all';

  // Fetch initial content for the latest term
  const [initialGroupedData, initialValidPraktikums] = await Promise.all([
    getMataKuliahByTerm(selectedTerm),
    getPraktikumByTerm(selectedTerm),
  ]);

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
