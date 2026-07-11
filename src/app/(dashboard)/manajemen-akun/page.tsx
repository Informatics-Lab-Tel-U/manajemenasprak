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

  const users: UserWithEmail[] = (authUsers?.users ?? []).reduce((acc: UserWithEmail[], u: any) => {
    const profile = profileMap.get(u.id);
    if (profile && !profile.deleted_at) {
      acc.push({
        id: u.id,
        email: u.email ?? '',
        nama_lengkap: profile.nama_lengkap ?? '—',
        role: profile.role ?? 'ASPRAK_KOOR',
        created_at: u.created_at,
        updated_at: profile.updated_at ?? u.created_at,
      });
    }
    return acc;
  }, []);

  return <ManajemenAkunClientPage users={users} />;
}
