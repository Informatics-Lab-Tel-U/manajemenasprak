import { requireRole } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { ManajemenAkunClientPage } from '@/components/manajemen-akun/ManajemenAkunClientPage';
import type { Pengguna } from '@/types/database';

export const dynamic = 'force-dynamic';

type UserWithEmail = Pengguna & { email: string };

export default async function ManajemenAkunPage() {
  await requireRole(['ADMIN'], '/');

  const admin = createAdminClient();

  const [{ data: authUsers }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers(),
    admin.from('pengguna').select('*'),
  ]);

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  const users: UserWithEmail[] = (authUsers?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? '',
    nama_lengkap: profileMap.get(u.id)?.nama_lengkap ?? '—',
    role: profileMap.get(u.id)?.role ?? 'ASPRAK_KOOR',
    created_at: u.created_at,
    updated_at: profileMap.get(u.id)?.updated_at ?? u.created_at,
  }));

  return <ManajemenAkunClientPage users={users} />;
}
