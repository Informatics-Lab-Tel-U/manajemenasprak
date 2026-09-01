import { requireAuth } from '@/lib/auth';
import { getCachedAvailableTerms } from '@/services/asprakService';
import { AsprakClientWrapper } from './AsprakClientWrapper';

export const dynamic = 'force-dynamic';

export default async function AsprakPage() {
  await requireAuth();

  let terms: string[] = [];

  try {
    const termsRes = await getCachedAvailableTerms();
    terms = termsRes || [];
  } catch (error) {
    console.error('[AsprakPage] SSR terms fetch error:', error);
  }

  return (
    <AsprakClientWrapper
      initialAsprakList={[]}
      initialTerms={terms}
      initialExistingCodes={[]}
      initialExistingNims={[]}
      initialExistingAspraks={[]}
    />
  );
}

