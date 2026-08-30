'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import PraktikumCard from './PraktikumCard';
import type { PraktikumWithStats } from '@/services/praktikumService';

interface PraktikumListProps {
  praktikums: PraktikumWithStats[];
  loading: boolean;
  onSelect: (praktikum: PraktikumWithStats) => void;
}

export function PraktikumCardSkeleton() {
  return (
    <Card className="bg-card shadow-sm h-full min-h-[142px] flex flex-col">
      <div className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex-grow mb-2">
          <Skeleton className="h-6 w-3/4 rounded-md" />
        </div>
        <div className="mt-auto pt-3 border-t border-border/50 flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full shrink-0" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function PraktikumList({ praktikums, loading, onSelect }: PraktikumListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[2000px]:grid-cols-6 gap-4 2xl:gap-6 animate-pulse">
        {Array.from({ length: 12 }).map((_, i) => (
          <PraktikumCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (praktikums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/20">
        <p className="text-muted-foreground font-medium">
          Tidak ada data praktikum untuk term ini.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Silakan import data praktikum terlebih dahulu.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[2000px]:grid-cols-6 gap-4 2xl:gap-6 animate-in fade-in duration-500">
      {praktikums.map((p) => (
        <PraktikumCard key={p.id} praktikum={p} onClick={onSelect} />
      ))}
    </div>
  );
}
