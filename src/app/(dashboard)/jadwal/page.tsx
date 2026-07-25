import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { getCachedAvailableTerms, getCachedJadwalByTerm } from '@/services/jadwalService';
import { getAllMataKuliah } from '@/services/praktikumService';
import { Jadwal, MataKuliah } from '@/types/database';
import JadwalClientPage from './JadwalClientPage';
import JadwalLoading from './loading';

export const dynamic = 'force-dynamic';

export default async function JadwalPage() {
  await requireAuth();

  let terms: string[] = [];
  let mataKuliahList: MataKuliah[] = [];
  let initialJadwal: Jadwal[] = [];

  try {
    // Parallelize initial data fetching with cached versions for deduplication
    const res = await Promise.all([
      getCachedAvailableTerms(),
      getAllMataKuliah(),
    ]);
    terms = res[0] || [];
    mataKuliahList = res[1] || [];

    // Fetch initial schedule for the latest term with cached version
    initialJadwal = await getCachedJadwalByTerm(terms[0] || 'all');
  } catch (error) {
    console.error('[JadwalPage] SSR initial data fetch failed, using fallback empty array:', error);
  }

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
