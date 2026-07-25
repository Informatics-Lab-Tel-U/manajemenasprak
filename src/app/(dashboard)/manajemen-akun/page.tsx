import { requireRole } from '@/lib/auth';
import { ManajemenAkunClientPage } from '@/components/manajemen-akun/ManajemenAkunClientPage';
import type { Pengguna } from '@/types/database';
import { honoFetch } from '@/lib/honoClient';

export const dynamic = 'force-dynamic';

type UserWithEmail = Pengguna & { email: string };

export default async function ManajemenAkunPage() {
  await requireRole(['ADMIN'], '/');

  let users: UserWithEmail[] = [];
  try {
    const response = await honoFetch<UserWithEmail[]>('/api/admin/users');
    if (response.ok && response.data) {
      users = response.data;
    }
  } catch (error) {
    console.error('Failed to fetch admin users:', error);
  }

  return <ManajemenAkunClientPage users={users} />;
}
