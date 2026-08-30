import { requireRole } from '@/lib/auth';
import { ManajemenAkunClientPage } from '@/components/manajemen-akun/ManajemenAkunClientPage';
import type { Pengguna } from '@/types/database';
import { honoFetch } from '@/lib/honoClient';

export const dynamic = 'force-dynamic';

type UserWithEmail = Pengguna & { email: string; auth_created_at?: string };

export default async function ManajemenAkunPage() {
  await requireRole(['ADMIN'], '/');

  let users: UserWithEmail[] = [];
  let requests: UserWithEmail[] = [];

  try {
    const [usersRes, requestsRes] = await Promise.all([
      honoFetch<UserWithEmail[]>('/api/admin/users'),
      honoFetch<UserWithEmail[]>('/api/admin/users/requests'),
    ]);

    if (usersRes.ok && usersRes.data) {
      users = usersRes.data.filter((u) => !u.deleted_at && (u.status === 'ACTIVE' || !u.status));
    }
    if (requestsRes.ok && requestsRes.data) {
      requests = requestsRes.data.filter((u) => !u.deleted_at);
    }
  } catch (error) {
    console.error('Failed to fetch admin users or access requests:', error);
  }

  return <ManajemenAkunClientPage users={users} requests={requests} />;
}
