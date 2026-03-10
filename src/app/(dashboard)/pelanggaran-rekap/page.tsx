import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { getTahunAjaranList } from '@/services/praktikumService';
import PelanggaranRekapClient from './PelanggaranRekapClient';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Rekap Pelanggaran | Informatics Lab',
  description: 'Rekapitulasi data pelanggaran asisten praktikum',
};

export default async function PelanggaranRekapPage() {
  const [user, years] = await Promise.all([getCurrentUser(), getTahunAjaranList()]);

  if (!user) return null;

  return (
    <Suspense fallback={<RekapLoading />}>
      <PelanggaranRekapClient initialTahunAjaranList={years} userRole={user.pengguna.role} />
    </Suspense>
  );
}

function RekapLoading() {
  return (
    <div className="container space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-64" />
      </div>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
