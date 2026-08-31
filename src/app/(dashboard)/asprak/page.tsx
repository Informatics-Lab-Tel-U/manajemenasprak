import { requireAuth } from '@/lib/auth';
import {
  getCachedAvailableTerms,
  getCachedAspraksWithAssignments,
  getExistingCodes,
  getCachedAllAsprak,
} from '@/services/asprakService';
import { AsprakClientWrapper } from './AsprakClientWrapper';

export const dynamic = 'force-dynamic';

export default async function AsprakPage() {
  await requireAuth();

  let terms: string[] = [];
  let existingCodes: string[] = [];
  let allAsprak: any[] = [];
  let initialAsprakList: any[] = [];

  try {
    const [termsRes, codesRes, allAsprakRes, asprakListRes] = await Promise.all([
      getCachedAvailableTerms(),
      getExistingCodes(),
      getCachedAllAsprak(),
      getCachedAspraksWithAssignments('all'),
    ]);
    terms = termsRes || [];
    existingCodes = codesRes || [];
    allAsprak = allAsprakRes || [];
    initialAsprakList = asprakListRes || [];
  } catch (error) {
    console.error('[AsprakPage] SSR data fetch error:', error);
  }

  const initialExistingNims = (allAsprak || []).map((a) => ({ nim: a.nim, role: a.role, kode: a.kode }));
  const initialExistingAspraks = (allAsprak || []).map((a) => ({
    nim: a.nim,
    kode: a.kode,
    angkatan: a.angkatan ?? 0,
  }));

  return (
    <AsprakClientWrapper
      initialAsprakList={initialAsprakList}
      initialTerms={terms}
      initialExistingCodes={existingCodes}
      initialExistingNims={initialExistingNims}
      initialExistingAspraks={initialExistingAspraks}
    />
  );
}
