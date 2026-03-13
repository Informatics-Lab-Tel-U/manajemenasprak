import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { getAvailableTerms } from '@/services/asprakService';
import { getPraktikumByTerm } from '@/services/praktikumService';
import PraktikumClientPage from './PraktikumClientPage';
import PraktikumLoading from './loading';

export default async function PraktikumPage() {
  await requireAuth();

  // Fetch terms first to know what to load
  const terms = await getAvailableTerms();
  const selectedTerm = terms[0] || 'all';

  // Fetch initial content for the latest term
  const initialPraktikumList = await getPraktikumByTerm(selectedTerm);

  return (
    <Suspense fallback={<PraktikumLoading />}>
      <PraktikumClientPage initialPraktikumList={initialPraktikumList} initialTerms={terms} />
    </Suspense>
  );
}
