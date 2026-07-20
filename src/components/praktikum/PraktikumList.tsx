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
    <Card className="relative overflow-hidden transition-all duration-300 border backdrop-blur-sm bg-white/60 dark:bg-zinc-900/60 border-indigo-200/50 dark:border-indigo-500/20 h-full min-h-[136px]">
      <div className="p-4 flex flex-col h-full relative z-10">
        <div className="flex justify-between items-start mb-3">
          <Skeleton className="h-6 2xl:h-[26px] w-[100px] rounded-md" />
        </div>
        <div className="flex-grow mb-2">
          <Skeleton className="h-7 2xl:h-7 w-3/4 rounded-md" />
        </div>
        <div className="mt-auto pt-3 border-t border-dashed border-border/60 dark:border-indigo-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-sm shrink-0" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 2xl:h-4 w-16" />
              <Skeleton className="h-4 2xl:h-5 w-12" />
            </div>
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
