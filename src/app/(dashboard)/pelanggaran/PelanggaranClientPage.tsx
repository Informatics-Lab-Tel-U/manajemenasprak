'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Praktikum, Asprak, Jadwal } from '@/types/database';
import { cn } from '@/lib/utils';
import { usePelanggaran } from '@/hooks/usePelanggaran';
import { Skeleton } from '@/components/ui/skeleton';

function PelanggaranCardSkeleton() {
  return (
    <div className="relative overflow-hidden border backdrop-blur-sm bg-white/60 dark:bg-zinc-900/60 flex flex-col gap-4 rounded-xl p-5 h-[160px]">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-end gap-2">
          <Skeleton className="h-10 w-12" />
          <Skeleton className="h-4 w-16 mb-1" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

interface Props {
  initialPraktikumList: Praktikum[];
  initialTahunAjaranList: string[];
  initialCountMap: Record<string, { total: number; allFinal: boolean; finalized: boolean }>;
  initialAsprakList: (Asprak & { praktikum_ids?: string[] })[];
  initialJadwalList: (Jadwal & { id_praktikum?: string })[];
  isKoor: boolean;
  userId?: string;
}

export default function PelanggaranClientPage({
  initialPraktikumList,
  initialTahunAjaranList,
  initialCountMap,
  initialAsprakList,
  initialJadwalList,
  isKoor,
  userId,
}: Props) {
  const router = useRouter();
  const {
    praktikumList,
    tahunAjaranList,
    selectedTahun: filterTahun,
    setSelectedTahun: setFilterTahun,
    countMap,
    loading,
  } = usePelanggaran(initialTahunAjaranList[0], isKoor, userId);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // ── Hydration fix ──
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Use state with initial props as fallback to avoid flicker, or just use hook data
  const displayedPraktikum = praktikumList.length > 0 ? praktikumList : initialPraktikumList;
  const displayedTahunList = tahunAjaranList.length > 0 ? tahunAjaranList : initialTahunAjaranList;
  const displayedCountMap = Object.keys(countMap).length > 0 ? countMap : initialCountMap;

  const currentTahun = filterTahun || initialTahunAjaranList[0] || '';

  const filteredPraktikum = React.useMemo(
    () =>
      currentTahun
        ? displayedPraktikum.filter((p) => p.tahun_ajaran === currentTahun)
        : displayedPraktikum,
    [displayedPraktikum, currentTahun]
  );

  if (!mounted) {
    return (
      <div className="container py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="card glass p-4 mb-6 flex items-center gap-3">
          <Skeleton className="h-8 w-full max-w-[240px]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PelanggaranCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pelanggaran</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log indisipliner asisten praktikum per praktikum
          </p>
        </div>
      </div>

      {/* Filter Tahun */}
      <div className="card glass p-4 mb-6 flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Tahun Ajaran:</span>
        <Select value={currentTahun} onValueChange={setFilterTahun} disabled={loading}>
          <SelectTrigger className="h-8 w-[160px] text-sm">
            <SelectValue placeholder="Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {displayedTahunList.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {loading && (
          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin ml-2" />
        )}
      </div>

      {loading && filteredPraktikum.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PelanggaranCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredPraktikum.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-16">Tidak ada data praktikum.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                      <h3 className="font-semibold text-lg leading-snug text-foreground/90 dark:text-foreground group-hover:text-foreground transition-colors">
                        {p.nama}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 font-mono opacity-80">
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
                      <span className="text-3xl font-bold tracking-tight text-foreground">
                        {info.total}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1.5 font-medium uppercase tracking-wider">
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
