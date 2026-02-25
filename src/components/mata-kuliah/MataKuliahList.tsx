import { useState } from 'react';
import { useAsprak } from '@/hooks/useAsprak';
import MataKuliahCard from './MataKuliahCard';
import type { MataKuliahGrouped } from '@/services/mataKuliahService';

interface MataKuliahListProps {
  groupedData: MataKuliahGrouped[];
  loading: boolean;
  onRefresh: () => void;
}

export default function MataKuliahList({ groupedData, loading, onRefresh }: MataKuliahListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-muted rounded-xl" />
        ))}
      </div>
    );
  }

  if (groupedData.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-xl">
        <h3 className="text-lg font-medium text-muted-foreground">
          Belum ada data mata kuliah untuk term ini.
        </h3>
        <p className="text-sm text-muted-foreground mt-1">Silakan import CSV atau tambah manual.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groupedData.map((group) => (
        <div key={group.mk_singkat} className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <h2 className="text-xl font-bold tracking-tight text-primary">{group.mk_singkat}</h2>
            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {group.items.length} variants
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.items.map((mk) => (
              <MataKuliahCard key={mk.id} mk={mk} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
