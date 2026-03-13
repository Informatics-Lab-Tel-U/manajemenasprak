import { Skeleton } from '@/components/ui/skeleton';

export function PelanggaranCardSkeleton() {
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
