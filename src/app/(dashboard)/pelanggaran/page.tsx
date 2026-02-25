import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import PelanggaranClientPage from './PelanggaranClientPage';
import type { Pelanggaran, AsprakKoordinator } from '@/types/database';

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
      program_studi
    )
  )
`;

export default async function PelanggaranPage() {
  const authUser = await requireAuth();
  const supabase = await createClient();
  const role = authUser.pengguna.role;

  // Fetch pelanggaran — RLS automatically scopes data based on the logged-in user's role
  const { data: violations } = await supabase
    .from('pelanggaran')
    .select(PELANGGARAN_SELECT)
    .order('created_at', { ascending: false });

  // For ASPRAK_KOOR: fetch their koordinator assignments so client can show per-matkul finalize buttons
  let koorAssignments: AsprakKoordinator[] = [];
  if (role === 'ASPRAK_KOOR') {
    const { data } = await supabase
      .from('asprak_koordinator')
      .select(`
        *,
        mata_kuliah:mata_kuliah (
          id,
          nama_lengkap,
          program_studi
        )
      `)
      .eq('id_pengguna', authUser.id)
      .eq('is_active', true);

    koorAssignments = (data ?? []) as AsprakKoordinator[];
  }

  return (
    <PelanggaranClientPage
      violations={(violations ?? []) as Pelanggaran[]}
      role={role}
      koorAssignments={koorAssignments}
    />
  );
}