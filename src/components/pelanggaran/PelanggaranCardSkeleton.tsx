import { Skeleton } from '@/components/ui/skeleton';

export function PelanggaranCardSkeleton() {
  return (
    <div className="relative overflow-hidden border border-primary/20 dark:border-primary/20 backdrop-blur-sm bg-white/60 dark:bg-zinc-900/60 flex flex-col rounded-xl h-full min-h-[142px] 2xl:min-h-[160px]">
      <div className="p-5 flex flex-col h-full relative z-10">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 2xl:h-6 w-3/4" />
            <Skeleton className="h-3 2xl:h-4 w-1/4 mt-1" />
          </div>
          <Skeleton className="h-[22px] w-[60px] rounded-full shrink-0" />
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-baseline gap-1.5">
            <Skeleton className="h-8 2xl:h-10 w-8" />
            <Skeleton className="h-3 2xl:h-3.5 w-20" />
          </div>
          <Skeleton className="h-9 w-[76px] rounded-md" />
        </div>
      </div>
    </div>
  );
}
