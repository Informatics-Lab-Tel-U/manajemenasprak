import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { getAvailableTerms, getJadwalByTerm } from '@/services/jadwalService';
import { getAllMataKuliah } from '@/services/praktikumService';
import JadwalClientPage from './JadwalClientPage';
import JadwalLoading from './loading';

export default async function JadwalPage() {
  await requireAuth();

  // Parallelize initial data fetching
  const [terms, mataKuliahList] = await Promise.all([getAvailableTerms(), getAllMataKuliah()]);

  // Fetch initial schedule for the latest term
  const initialJadwal = await getJadwalByTerm(terms[0] || 'all');

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
