import { requireRole } from '@/lib/auth';
import { ManajemenAkunClientPage } from '@/components/manajemen-akun/ManajemenAkunClientPage';
import type { Pengguna } from '@/types/database';
import { honoFetch } from '@/lib/honoClient';

export const dynamic = 'force-dynamic';

type UserWithEmail = Pengguna & { email: string; auth_created_at?: string; provider?: string };

export default async function ManajemenAkunPage() {
  await requireRole(['ADMIN'], '/');

  let users: UserWithEmail[] = [];
  let requests: UserWithEmail[] = [];

  try {
    const usersRes = await honoFetch<UserWithEmail[]>('/api/admin/users');

    if (usersRes.ok && usersRes.data) {
      users = usersRes.data.filter((u) => !u.deleted_at && (u.status === 'ACTIVE' || !u.status));
      requests = usersRes.data.filter((u) => !u.deleted_at && (u.status === 'PENDING' || u.status === 'REJECTED'));
    }
  } catch (error) {
    console.error('Failed to fetch admin users:', error);
  }

  return <ManajemenAkunClientPage users={users} requests={requests} />;
}
