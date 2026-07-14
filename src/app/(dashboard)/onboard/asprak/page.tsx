import React, { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  getExistingCodes,
  getCachedAllAsprak,
} from '@/services/asprakService.server';
import AsprakOnboardClient from './AsprakOnboardClient';

export default async function AsprakOnboardPage(props: {
  searchParams: Promise<{ term?: string }>;
}) {
  await requireAuth();

  const searchParams = await props.searchParams;
  const term = searchParams.term;

  if (!term) {
    redirect('/onboard');
  }

  // Fetch initial data for validation
  const [existingCodes, allAsprak] = await Promise.all([
    getExistingCodes(),
    getCachedAllAsprak(),
  ]);

  const initialExistingNims = allAsprak.map((a) => ({ nim: a.nim, role: a.role, kode: a.kode }));
  const initialExistingAspraks = allAsprak.map((a) => ({
    nim: a.nim,
    kode: a.kode,
    angkatan: a.angkatan ?? 0,
  }));

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading Asprak Data...</div>}>
      <AsprakOnboardClient
        term={term}
        initialExistingCodes={existingCodes}
        initialExistingNims={initialExistingNims}
        initialExistingAspraks={initialExistingAspraks}
      />
    </Suspense>
  );
}
