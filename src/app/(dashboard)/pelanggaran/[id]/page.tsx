import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PelanggaranDetailClient from '@/app/(dashboard)/pelanggaran/[id]/PelanggaranDetailClient';
import type { Pelanggaran, Praktikum } from '@/types/database';
import * as praktikumService from '@/services/praktikumService';
import * as pelanggaranService from '@/services/pelanggaranService';

export const dynamic = 'force-dynamic';

export default async function PelanggaranDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const authUser = await requireAuth();
  const role = authUser.pengguna.role;

  return (
    <PelanggaranDetailClient
      role={role}
      idPraktikum={id}
    />
  );
}
