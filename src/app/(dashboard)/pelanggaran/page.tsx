import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import PelanggaranClientPage from './PelanggaranClientPage';
import type { Praktikum, Asprak, Jadwal } from '@/types/database';
import * as pelanggaranService from '@/services/pelanggaranService';
import * as praktikumService from '@/services/praktikumService';
import * as asprakService from '@/services/asprakService';

export const dynamic = 'force-dynamic';

export default async function PelanggaranPage() {
  const supabase = await createClient();
  const authUser = await requireAuth();

  const role = authUser.pengguna.role;
  const isKoor = role === 'ASPRAK_KOOR';

  // ── Parallelize data fetching ──
  const [praktikumList, countMap] = await Promise.all([
    isKoor
      ? pelanggaranService.getKoorPraktikumList(authUser.id, supabase)
      : praktikumService.getAllPraktikum(),
    pelanggaranService.getPelanggaranCountsByPraktikum(isKoor, supabase),
  ]);

  const tahunAjaranList = Array.from(new Set(praktikumList.map((p) => p.tahun_ajaran)))
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
