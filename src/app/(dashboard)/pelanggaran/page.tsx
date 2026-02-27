import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import PelanggaranClientPage from './PelanggaranClientPage';
import type { Praktikum, Asprak, Jadwal } from '@/types/database';
import * as pelanggaranService from '@/services/pelanggaranService';
import * as praktikumService from '@/services/praktikumService';
import * as asprakService from '@/services/asprakService';

export const dynamic = 'force-dynamic';

export default async function PelanggaranPage() {
  const authUser = await requireAuth();
  const supabase = await createClient();
  const role = authUser.pengguna.role;
  const isKoor = role === 'ASPRAK_KOOR';

  // ── Fetch praktikum list (scoped for ASPRAK_KOOR) ──
  let praktikumList: Praktikum[] = [];

  if (isKoor) {
    praktikumList = await pelanggaranService.getKoorPraktikumList(authUser.id, supabase);
  } else {
    praktikumList = await praktikumService.getAllPraktikum();
  }

  const tahunAjaranList = Array.from(new Set(praktikumList.map((p) => p.tahun_ajaran))).sort().reverse();

  // ── Fetch violation counts per praktikum ──
  const countMap = await pelanggaranService.getPelanggaranCountsByPraktikum(isKoor, supabase);

  // ── Fetch asprak (for add modal) ──
  const asprakWithAssignments = await asprakService.getAspraksWithAssignments();
  const asprakList = asprakWithAssignments.map((a) => ({
    id: a.id,
    nama_lengkap: a.nama_lengkap,
    nim: a.nim,
    kode: a.kode,
    angkatan: a.angkatan,
    created_at: a.created_at,
    updated_at: a.updated_at,
    praktikum_ids: a.assignments.map((ap) => ap.id),
  })) as (Asprak & { praktikum_ids?: string[] })[];

  // ── Fetch jadwal (for add modal) ──
  const jadwalList = (await pelanggaranService.getJadwalForPelanggaran()) as (Jadwal & {
    id_praktikum?: string;
  })[];

  return (
    <PelanggaranClientPage
      initialPraktikumList={praktikumList}
      initialTahunAjaranList={tahunAjaranList}
      initialCountMap={countMap}
      initialAsprakList={asprakList}
      initialJadwalList={jadwalList}
      isKoor={isKoor}
      userId={authUser.id}
    />
  );
}