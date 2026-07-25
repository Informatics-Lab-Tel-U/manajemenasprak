import { requireAuth } from '@/lib/auth';
import PelanggaranClientPage from './PelanggaranClientPage';
import * as pelanggaranService from '@/services/pelanggaranService';
import * as praktikumService from '@/services/praktikumService';

export const dynamic = 'force-dynamic';

export default async function PelanggaranPage() {
  const authUser = await requireAuth();

  const role = authUser.pengguna.role;
  const isKoor = role === 'ASPRAK_KOOR';

  // ── Parallelize data fetching ──
  const [praktikumList, countMap] = await Promise.all([
    isKoor
      ? pelanggaranService.getKoorPraktikumList(authUser.id)
      : praktikumService.getAllPraktikum(),
    pelanggaranService.getPelanggaranCountsByPraktikum(isKoor),
  ]);

  const tahunAjaranList: string[] = Array.from(new Set<string>(praktikumList.map((p: any) => p.tahun_ajaran as string)))
    .sort()
    .reverse();

  return (
    <PelanggaranClientPage
      initialPraktikumList={praktikumList}
      initialTahunAjaranList={tahunAjaranList}
      initialCountMap={countMap}
      isKoor={isKoor}
      userId={authUser.id}
    />
  );
}
