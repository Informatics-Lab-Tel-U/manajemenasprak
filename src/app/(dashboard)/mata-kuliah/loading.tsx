import { Skeleton } from '@/components/ui/skeleton';
import { MataKuliahCardSkeleton } from '@/components/mata-kuliah/MataKuliahList';

export default function MataKuliahLoading() {
  return (
    <div className="container mx-auto max-w-[2000px] 2xl:px-8 relative space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl 2xl:text-3xl font-bold tracking-tight">Mata Kuliah</h1>
          <p className="text-sm 2xl:text-base text-muted-foreground mt-1">
            Kelola data mata kuliah, koordinator, dan varian prodi per tahun ajaran.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 items-center w-full md:w-auto">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="card glass p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Skeleton className="h-10 flex-1 w-full" />
          <Skeleton className="h-10 w-full sm:w-[180px]" />
        </div>
      </div>

      <div className="space-y-8">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-7 w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[2000px]:grid-cols-6 gap-4 2xl:gap-6 animate-pulse">
              {Array.from({ length: 6 }).map((_, j) => (
                <MataKuliahCardSkeleton key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
