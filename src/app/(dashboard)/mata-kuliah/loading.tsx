import { Skeleton } from '@/components/ui/skeleton';

export default function MataKuliahLoading() {
  return (
    <div className="container relative space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Mata Kuliah</h1>
          <p className="text-sm text-muted-foreground mt-1">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-[184px] rounded-xl border bg-card animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
