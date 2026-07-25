import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getAllMataKuliah } from '@/services/praktikumService';
import JadwalOnboardClient from './JadwalOnboardClient';

export const dynamic = 'force-dynamic';

export default async function JadwalOnboardPage(props: { searchParams: Promise<{ term?: string }> }) {
  await requireAuth();

  const searchParams = await props.searchParams;
  const term = searchParams.term;
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
