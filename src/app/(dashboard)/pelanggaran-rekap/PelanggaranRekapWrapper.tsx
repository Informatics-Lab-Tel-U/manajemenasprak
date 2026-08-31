'use client';

import dynamic from 'next/dynamic';
import type { Role } from '@/config/rbac';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  initialTahunAjaranList: string[];
  userRole: Role;
}

function RekapLoading() {
  return (
    <div className="container mx-auto max-w-[2000px] 2xl:px-8 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-1">
        <Skeleton className="h-9 2xl:h-10 w-64" />
        <Skeleton className="h-4 2xl:h-5 w-96 opacity-50" />
      </div>

      {/* Filters Card Skeleton */}
      <div className="card glass p-6 border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Table Card Skeleton */}
      <div className="card glass border border-border/50 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-border/50 bg-muted/20">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="p-6">
          <div className="rounded-md border overflow-hidden">
            <div className="space-y-4 p-4">
              <Skeleton className="h-8 w-full" />
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full opacity-60" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PelanggaranRekapClient = dynamic(() => import('./PelanggaranRekapClient'), {
  ssr: false,
  loading: () => <RekapLoading />,
});

export function PelanggaranRekapWrapper(props: Props) {
  return <PelanggaranRekapClient {...props} />;
}
