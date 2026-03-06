import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import MataKuliahCard from './MataKuliahCard';
import type { MataKuliahGrouped } from '@/services/mataKuliahService';

interface MataKuliahListProps {
  groupedData: MataKuliahGrouped[];
  loading: boolean;
  onRefresh: () => void;
}

function MataKuliahCardSkeleton() {
  return (
    <Card className="relative overflow-hidden transition-all duration-300 border bg-white/60 dark:bg-zinc-900/60 rounded-xl border-primary/20 dark:border-primary/20">
      <div className="p-5 flex flex-col h-[184px] relative z-10">
        <div className="flex justify-between items-start mb-3">
          <Skeleton className="h-6 w-32 rounded-md" />
        </div>
        <div className="flex-grow mb-4">
          <Skeleton className="h-5 w-full rounded-md mt-1" />
          <Skeleton className="h-3 w-24 rounded-md mt-2" />
        </div>
        <div className="mt-auto pt-3 border-t border-dashed border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-sm" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-2 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function MataKuliahList({ groupedData, loading, onRefresh }: MataKuliahListProps) {
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {[1, 2].map((groupIndex) => (
          <div key={groupIndex} className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <MataKuliahCardSkeleton key={i} />
              ))}
            </div>
          </div>
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
            <h2 className="text-xl font-bold tracking-tight text-foreground">{group.mk_singkat}</h2>
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
