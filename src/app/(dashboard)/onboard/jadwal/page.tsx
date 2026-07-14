import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getAllMataKuliah } from '@/services/praktikumService';
import JadwalOnboardClient from './JadwalOnboardClient';

export default async function JadwalOnboardPage(props: { searchParams: Promise<{ term?: string }> }) {
  await requireAuth();

  const searchParams = await props.searchParams;
  const term = searchParams.term;
  if (!term) {
    redirect('/onboard');
  }

  // Fetch only MKs that belong to the current term
  const allMk = await getAllMataKuliah();
  const filteredMk = allMk.filter((mk) => mk.praktikum?.tahun_ajaran === term);

  return (
    <Suspense fallback={<div className="p-8 text-center animate-pulse">Memuat...</div>}>
      <JadwalOnboardClient term={term} mataKuliahList={filteredMk} />
    </Suspense>
  );
}
