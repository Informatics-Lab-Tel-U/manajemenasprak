
'use client';

import { useState } from 'react';
import PraktikumCard from './PraktikumCard';
import { PraktikumWithStats } from '@/services/praktikumService';

interface PraktikumListProps {
  praktikums: PraktikumWithStats[];
  loading: boolean;
  onSelect: (praktikum: PraktikumWithStats) => void;
}

export default function PraktikumList({ praktikums, loading, onSelect }: PraktikumListProps) {
  if (loading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg w-full"></div>
        ))}
    </div>;
  }

  if (praktikums.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/20">
            <p className="text-muted-foreground font-medium">Tidak ada data praktikum untuk term ini.</p>
            <p className="text-xs text-muted-foreground mt-1">Silakan import data praktikum terlebih dahulu.</p>
        </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in duration-500">
      {praktikums.map((p) => (
        <PraktikumCard key={p.id} praktikum={p} onClick={onSelect} />
      ))}
    </div>
  );
}
