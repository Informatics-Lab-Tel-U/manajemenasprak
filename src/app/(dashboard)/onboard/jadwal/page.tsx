import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getAllMataKuliah } from '@/services/praktikumService';
import { getJadwalByTerm } from '@/services/jadwalService';
import JadwalOnboardClient from './JadwalOnboardClient';
import { getCachedAvailableTerms } from '@/services/termService';

export const dynamic = 'force-dynamic';

export default async function JadwalOnboardPage(props: { searchParams: Promise<{ term?: string }> }) {
  await requireAuth();

  const searchParams = await props.searchParams;
  let term = searchParams.term;
  if (!term) {
    try {
      const availableTerms = await getCachedAvailableTerms();
      if (availableTerms && availableTerms.length > 0) {
        term = availableTerms[0];
      }
    } catch {
      // fallback
    }
  }

  if (!term) {
    redirect('/onboard');
  }

  // Fetch only MKs and jadwal that belong to the current term
  let filteredMk: any[] = [];
  let existingJadwal: any[] = [];
  let isAlreadyDone = false;
  try {
    const [allMk, jadwalRes] = await Promise.all([
      getAllMataKuliah(),
      getJadwalByTerm(term)
    ]);
    const flatMk = (allMk || []).flatMap((g: any) => (g.items ? g.items : [g]));
    filteredMk = flatMk.filter((mk) => mk.praktikum?.tahun_ajaran === term);
    existingJadwal = jadwalRes || [];
    isAlreadyDone = existingJadwal.length > 0;
  } catch (error) {
    console.error('[JadwalOnboardPage] SSR fetch error:', error);
  }

  return <JadwalOnboardClient term={term} mataKuliahList={filteredMk} initialJadwalList={existingJadwal} isAlreadyDone={isAlreadyDone} />;
}
