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

function PraktikumCardSkeleton() {
  return (
    <Card className="p-5 flex flex-col h-[152px] relative overflow-hidden transition-all duration-300 border bg-white/60 dark:bg-zinc-900/60 border-indigo-200/50 dark:border-indigo-500/20">
      <div className="flex justify-between items-start mb-3">
        <Skeleton className="h-6 w-24 rounded-md" />
      </div>
      <div className="flex-grow mb-4">
        <Skeleton className="h-5 w-full rounded-md" />
      </div>
      <div className="mt-auto pt-3 border-t border-dashed border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-sm" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-2 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function PraktikumList({ praktikums, loading, onSelect }: PraktikumListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
      {praktikums.map((p) => (
        <PraktikumCard key={p.id} praktikum={p} onClick={onSelect} />
      ))}
    </div>
  );
}
