import { Skeleton } from '@/components/ui/skeleton';

export default function PraktikumLoading() {
  return (
    <div className="container relative space-y-8">
      <header className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Data Praktikum</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola data praktikum dan penugasan per angkatan
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3 items-center w-full md:w-auto">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </header>

      <div className="mb-8">
        <div className="card glass p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Skeleton className="h-10 w-full sm:w-[200px]" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[152px] rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
