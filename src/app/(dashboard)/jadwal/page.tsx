import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { getCachedAvailableTerms, getCachedJadwalByTerm } from '@/services/jadwalService';
import { getAllMataKuliah } from '@/services/praktikumService';
import JadwalClientPage from './JadwalClientPage';
import JadwalLoading from './loading';

export default async function JadwalPage() {
  await requireAuth();

  // Parallelize initial data fetching with cached versions for deduplication
  const [terms, mataKuliahList] = await Promise.all([
    getCachedAvailableTerms(),
    getAllMataKuliah(),
  ]);

  // Fetch initial schedule for the latest term with cached version
  const initialJadwal = await getCachedJadwalByTerm(terms[0] || 'all');

  return (
    <Suspense fallback={<JadwalLoading />}>
      <JadwalClientPage
        initialJadwal={initialJadwal}
        initialTerms={terms}
        initialMataKuliahList={mataKuliahList}
      />
    </Suspense>
  );
}
