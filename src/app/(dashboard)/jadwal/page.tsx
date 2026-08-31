import { requireAuth } from '@/lib/auth';
import { getCachedAvailableTerms, getCachedJadwalByTerm } from '@/services/jadwalService';
import { getAllMataKuliah } from '@/services/praktikumService';
import { Jadwal, MataKuliah } from '@/types/database';
import { JadwalClientWrapper } from './JadwalClientWrapper';

export const dynamic = 'force-dynamic';

export default async function JadwalPage() {
  await requireAuth();

  let terms: string[] = [];
  let mataKuliahList: MataKuliah[] = [];
  let initialJadwal: Jadwal[] = [];

  try {
    const [termsRes, mkRes, jadwalRes] = await Promise.all([
      getCachedAvailableTerms(),
      getAllMataKuliah(),
      getCachedJadwalByTerm('all'),
    ]);
    terms = termsRes || [];
    mataKuliahList = mkRes || [];
    initialJadwal = jadwalRes || [];
  } catch (error) {
    console.error('[JadwalPage] SSR initial data fetch failed, using fallback empty array:', error);
  }

  return (
    <JadwalClientWrapper
      initialJadwal={initialJadwal}
      initialTerms={terms}
      initialMataKuliahList={mataKuliahList}
    />
  );
}
