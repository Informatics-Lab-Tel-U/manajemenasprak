'use client';

import dynamic from 'next/dynamic';
import type { Praktikum } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  initialPraktikumList: Praktikum[];
  initialTahunAjaranList: string[];
  initialCountMap: Record<string, { total: number; allFinal: boolean; finalized: boolean }>;
  isKoor: boolean;
  userId?: string;
}

function PelanggaranLoading() {
  return (
    <div className="container mx-auto max-w-[2000px] 2xl:px-8 space-y-6">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 opacity-60" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card glass p-6 space-y-4 border border-border/50">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

const PelanggaranClientPage = dynamic(() => import('./PelanggaranClientPage'), {
  ssr: false,
  loading: () => <PelanggaranLoading />,
});

export function PelanggaranClientWrapper(props: Props) {
  return <PelanggaranClientPage {...props} />;
}
