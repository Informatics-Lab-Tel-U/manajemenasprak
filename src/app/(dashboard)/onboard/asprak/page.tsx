import React, { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  getExistingCodes,
  getCachedAllAsprak,
} from '@/services/asprakService.server';
import AsprakOnboardClient from './AsprakOnboardClient';
import { getCachedAvailableTerms } from '@/services/termService';

export const dynamic = 'force-dynamic';

export default async function AsprakOnboardPage(props: {
  searchParams: Promise<{ term?: string }>;
}) {
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

  // Fetch initial data for validation
  let existingCodes: string[] = [];
  let allAsprak: any[] = [];
  try {
    const res = await Promise.all([
      getExistingCodes(),
      getCachedAllAsprak(),
    ]);
    existingCodes = res[0] || [];
    allAsprak = res[1] || [];
  } catch (error) {
    console.error('[AsprakOnboardPage] SSR fetch error:', error);
  }

  const initialExistingNims = (allAsprak || []).map((a) => ({ nim: a.nim, role: a.role, kode: a.kode }));
  const initialExistingAspraks = (allAsprak || []).map((a) => ({
    nim: a.nim,
    kode: a.kode,
    angkatan: a.angkatan ?? 0,
  }));

  return (
    <AsprakOnboardClient
      term={term}
      initialExistingCodes={existingCodes}
      initialExistingNims={initialExistingNims}
      initialExistingAspraks={initialExistingAspraks}
    />
  );
}
