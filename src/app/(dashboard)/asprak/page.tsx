import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import {
  getCachedAvailableTerms,
  getCachedAspraksWithAssignments,
  getExistingCodes,
  getCachedAllAsprak,
} from '@/services/asprakService';
import { getUniquePraktikumNames } from '@/services/praktikumService';
import AsprakClientPage from './AsprakClientPage';
import AsprakLoading from './loading';

export default async function AsprakPage() {
  await requireAuth();

  // Parallelize all initial data fetching with cached versions for deduplication
  const [terms, praktikumNames, existingCodes, allAsprak] = await Promise.all([
    getCachedAvailableTerms(),
    getUniquePraktikumNames(),
    getExistingCodes(),
    getCachedAllAsprak(),
  ]);

  // Fetch initial asprak list for the latest term
  const initialAsprakList = await getCachedAspraksWithAssignments(terms[0] || 'all');

  const initialExistingNims = allAsprak.map((a) => ({ nim: a.nim, role: a.role }));
  const initialExistingAspraks = allAsprak.map((a) => ({
    kode: a.kode,
    angkatan: a.angkatan ?? 0,
  }));

  return (
    <Suspense fallback={<AsprakLoading />}>
      <AsprakClientPage
        initialAsprakList={initialAsprakList}
        initialTerms={terms}
        initialPraktikumNames={praktikumNames}
        initialExistingCodes={existingCodes}
        initialExistingNims={initialExistingNims}
        initialExistingAspraks={initialExistingAspraks}
      />
    </Suspense>
  );
}
