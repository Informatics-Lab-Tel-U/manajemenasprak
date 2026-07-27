import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { getPraktikumByTerm, getAllMataKuliah } from '@/services/praktikumService';
import { getCachedAvailableTerms } from '@/services/termService';
import TahunAjaranBaruClient from './TahunAjaranBaruClient';

export const dynamic = 'force-dynamic';

export default async function TahunAjaranBaruPage(props: { searchParams: Promise<{ term?: string }> }) {
  await requireAuth('/login');

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

  let praktikumList: any[] = [];
  let mataKuliahList: any[] = [];
  if (term) {
    try {
      const [prakRes, mkRes] = await Promise.all([
        getPraktikumByTerm(term),
        getAllMataKuliah()
      ]);
      praktikumList = prakRes || [];
      const prakIds = new Set(praktikumList.map(p => p.id));
      const rawMkList = (mkRes || []).flatMap((g: any) => (g.items ? g.items : [g]));
      mataKuliahList = rawMkList.filter(mk => prakIds.has(mk.id_praktikum));
    } catch (error) {
      console.error('[TahunAjaranBaruPage] SSR fetch error:', error);
    }
  }

  return (
    <TahunAjaranBaruClient
      term={term || ''}
      initialPraktikumList={praktikumList}
      initialMataKuliahList={mataKuliahList}
    />
  );
}
