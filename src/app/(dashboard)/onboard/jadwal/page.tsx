import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getAllMataKuliah } from '@/services/praktikumService';
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

  // Fetch only MKs that belong to the current term
  let filteredMk: any[] = [];
  try {
    const allMk = await getAllMataKuliah();
    filteredMk = (allMk || []).filter((mk) => mk.praktikum?.tahun_ajaran === term);
  } catch (error) {
    console.error('[JadwalOnboardPage] SSR fetch error:', error);
  }

  return <JadwalOnboardClient term={term} mataKuliahList={filteredMk} />;
}
