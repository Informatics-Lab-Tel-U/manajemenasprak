import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import PelanggaranClientPage from './PelanggaranClientPage';
import type { Pelanggaran, Praktikum, Asprak, Jadwal } from '@/types/database';

export const dynamic = 'force-dynamic';

const PELANGGARAN_SELECT = `
  *,
  asprak:asprak (
    nama_lengkap,
    nim,
    kode
  ),
  jadwal:jadwal (
    hari,
    jam,
    kelas,
    mata_kuliah:mata_kuliah (
      id,
      nama_lengkap,
      program_studi,
      id_praktikum,
      praktikum:praktikum (
        id,
        nama,
        tahun_ajaran
      )
    )
  )
`;

export default async function PelanggaranPage() {
  const authUser = await requireAuth();
  const supabase = await createClient();
  const admin = createAdminClient();
  const role = authUser.pengguna.role;
  const isKoor = role === 'ASPRAK_KOOR';

  // ── Fetch pelanggaran (RLS scopes data automatically for ASPRAK_KOOR) ──
  const { data: violations } = await supabase
    .from('pelanggaran')
    .select(PELANGGARAN_SELECT)
    .order('created_at', { ascending: false });

  // ── Fetch praktikum list ──
  // For ASPRAK_KOOR: fetch only their assigned praktikum
  // For ADMIN/ASLAB: fetch all
  let praktikumList: Praktikum[] = [];
  let tahunAjaranList: string[] = [];

  if (isKoor) {
    // For ASPRAK_KOOR: only fetch their assigned praktikum via join
    // asprak_koordinator has: id_pengguna, id_praktikum, is_active (NO tahun_ajaran column)
    const { data: assignments } = await supabase
      .from('asprak_koordinator')
      .select('id_praktikum, praktikum:praktikum(id, nama, tahun_ajaran)')
      .eq('id_pengguna', authUser.id)
      .eq('is_active', true);

    // Deduplicate by praktikum id
    const seen = new Set<string>();
    for (const a of assignments ?? []) {
      const p = (a as any).praktikum;
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        praktikumList.push(p as Praktikum);
      }
    }
  } else {
    const { data: pList } = await admin.from('praktikum').select('*').order('nama');
    praktikumList = (pList ?? []) as Praktikum[];
  }

  // Extract unique tahun ajaran from praktikum list
  tahunAjaranList = Array.from(new Set(praktikumList.map((p) => p.tahun_ajaran))).sort().reverse();

  // ── Fetch asprak with their praktikum_ids ──
  const { data: asprakRaw } = await admin
    .from('asprak')
    .select('*, asprak_praktikum(id_praktikum)')
    .order('nim', { ascending: true });

  const asprakList = ((asprakRaw ?? []) as any[]).map((a) => ({
    id: a.id,
    nama_lengkap: a.nama_lengkap,
    nim: a.nim,
    kode: a.kode,
    angkatan: a.angkatan,
    created_at: a.created_at,
    updated_at: a.updated_at,
    praktikum_ids: (a.asprak_praktikum ?? []).map((ap: any) => ap.id_praktikum),
  })) as (Asprak & { praktikum_ids?: string[] })[];

  // ── Fetch jadwal with id_praktikum ──
  const { data: jadwalRaw } = await admin
    .from('jadwal')
    .select(`
      *,
      mata_kuliah:mata_kuliah (
        id,
        nama_lengkap,
        program_studi,
        id_praktikum,
        praktikum:praktikum (
          id,
          nama,
          tahun_ajaran
        )
      )
    `)
    .order('kelas', { ascending: true });

  const jadwalList = ((jadwalRaw ?? []) as any[]).map((j) => ({
    ...j,
    id_praktikum: j.mata_kuliah?.id_praktikum ?? null,
  })) as (Jadwal & { id_praktikum?: string })[];

  return (
    <PelanggaranClientPage
      violations={(violations ?? []) as Pelanggaran[]}
      role={role}
      praktikumList={praktikumList}
      tahunAjaranList={tahunAjaranList}
      asprakList={asprakList}
      jadwalList={jadwalList}
    />
  );
}