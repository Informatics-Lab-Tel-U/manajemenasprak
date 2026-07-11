import { requireAuth } from '@/lib/auth';
import PelanggaranDetailClient from '@/app/(dashboard)/pelanggaran/[id]/PelanggaranDetailClient';

export const dynamic = 'force-dynamic';

export default async function PelanggaranDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, authUser] = await Promise.all([params, requireAuth()]);
  const role = authUser.pengguna.role;

  return <PelanggaranDetailClient role={role} idPraktikum={id} />;
}
