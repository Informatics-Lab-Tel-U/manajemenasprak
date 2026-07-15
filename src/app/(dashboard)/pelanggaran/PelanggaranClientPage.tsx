'use client';

/* eslint-disable react-doctor/no-chain-state-updates, react-doctor/no-cascading-set-state, react-doctor/no-effect-chain, react-doctor/rendering-hydration-no-flicker */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';


import type { Praktikum } from '@/types/database';
import { cn } from '@/lib/utils';
import { usePelanggaran } from '@/hooks/usePelanggaran';
import { PelanggaranCardSkeleton } from '@/components/pelanggaran/PelanggaranCardSkeleton';

interface Props {
  initialPraktikumList: Praktikum[];
  initialTahunAjaranList: string[];
  initialCountMap: Record<string, { total: number; allFinal: boolean; finalized: boolean }>;
  isKoor: boolean;
  userId?: string;
}

export default function PelanggaranClientPage({
  initialPraktikumList,
  initialTahunAjaranList,
  initialCountMap,
  isKoor,
  userId,
}: Props) {
  const router = useRouter();
  const initialData = React.useMemo(() => ({
    praktikumList: initialPraktikumList,
    tahunAjaranList: initialTahunAjaranList,
    countMap: initialCountMap,
  }), [initialPraktikumList, initialTahunAjaranList, initialCountMap]);

  const {
    praktikumList,
    tahunAjaranList,
    selectedTahun: filterTahun,
    countMap,
    loading,
  } = usePelanggaran(initialTahunAjaranList[0], isKoor, userId, initialData);

  // ── Hydration fix ──
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Hook data is now pre-initialized with initial props
  const displayedPraktikum = praktikumList;
  const displayedTahunList = tahunAjaranList;
  const displayedCountMap = countMap;

  const currentTahun = filterTahun || initialTahunAjaranList[0] || '';

  const filteredPraktikum = React.useMemo(
    () =>
      currentTahun
        ? displayedPraktikum.filter((p) => p.tahun_ajaran === currentTahun)
        : displayedPraktikum,
    // eslint-disable-next-line react-doctor/exhaustive-deps
    [displayedPraktikum, currentTahun]
  );

  if (!mounted) {
    return (
      <div className="container mx-auto max-w-[2000px] 2xl:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl 2xl:text-3xl font-bold tracking-tight">Pelanggaran</h1>
            <p className="text-sm 2xl:text-base text-muted-foreground mt-1">
              Log indisipliner asisten praktikum per praktikum
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[2000px]:grid-cols-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <PelanggaranCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-[2000px] 2xl:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl 2xl:text-3xl font-bold tracking-tight">Pelanggaran</h1>
          <p className="text-sm 2xl:text-base text-muted-foreground mt-1">
            Log indisipliner asisten praktikum per praktikum
          </p>
        </div>

        {/* Filter Tahun */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <span className="text-sm font-medium text-muted-foreground hidden sm:block">
            {currentTahun ? `Tahun Ajaran Aktif: ${currentTahun}` : 'Memuat Tahun Ajaran...'}
          </span>
          {loading && (
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin ml-2" />
          )}
        </div>
      </div>

      {loading && filteredPraktikum.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[2000px]:grid-cols-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <PelanggaranCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredPraktikum.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-16">Tidak ada data praktikum.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[2000px]:grid-cols-5">
          {filteredPraktikum.map((p) => {
            const info = (displayedCountMap as any)[p.id] ?? {
              total: 0,
              allFinal: false,
              finalized: false,
            };
            return (
              <div
                key={p.id}
                className={cn(
                  'relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border backdrop-blur-sm',
                  'bg-white/60 dark:bg-zinc-900/60 flex flex-col gap-4 rounded-xl',
                  'border-primary/20 dark:border-primary/20'
                )}
              >
                {/* Dynamic Gradient Background Blob */}
                <div
                  className={cn(
                    'absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-40 dark:opacity-20 bg-gradient-to-br transition-opacity group-hover:opacity-60 dark:group-hover:opacity-30',
                    'from-primary/20 to-blue-500/20'
                  )}
                />

                <div className="p-5 flex flex-col h-full relative z-10">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                      <h3 className="font-semibold text-base 2xl:text-lg leading-snug text-foreground/90 dark:text-foreground group-hover:text-foreground transition-colors">
                        {p.nama}
                      </h3>
                      <p className="text-xs 2xl:text-sm text-muted-foreground mt-1 font-mono opacity-80">
                        {p.tahun_ajaran}
                      </p>
                    </div>
                    {info.finalized ? (
                      <Badge className="gap-1 shrink-0 bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-foreground/90 dark:border-primary/30 shadow-sm">
                        <CheckCircle2 className="h-3 w-3" />
                        Terfinalisasi
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 bg-white/50 dark:bg-white/5">
                        Aktif
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-2xl 2xl:text-4xl font-bold tracking-tight text-foreground">
                        {info.total}
                      </span>
                      <span className="text-[10px] 2xl:text-xs text-muted-foreground ml-1.5 font-medium uppercase tracking-wider">
                        pelanggaran
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/pelanggaran/${p.id}`)}
                      className="gap-1.5 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                    >
                      Lihat
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
