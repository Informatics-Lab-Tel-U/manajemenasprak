import { requireAuth } from '@/lib/auth';
import { getCachedAvailableTerms } from '@/services/jadwalService';
import { JadwalClientWrapper } from './JadwalClientWrapper';

export const dynamic = 'force-dynamic';

export default async function JadwalPage() {
  await requireAuth();

  let terms: string[] = [];

  try {
    const termsRes = await getCachedAvailableTerms();
    terms = termsRes || [];
  } catch (error) {
    console.error('[JadwalPage] SSR terms fetch failed:', error);
  }

  return (
    <JadwalClientWrapper
      initialJadwal={[]}
      initialTerms={terms}
      initialMataKuliahList={[]}
    />
  );
}
