import { Skeleton } from '@/components/ui/skeleton';
import { PraktikumCardSkeleton } from '@/components/praktikum/PraktikumList';

export default function PraktikumLoading() {
  return (
    <div className="container mx-auto max-w-[2000px] relative space-y-8 2xl:px-8">
      <header className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl 2xl:text-3xl font-bold tracking-tight">Data Praktikum</h1>
            <p className="text-sm 2xl:text-base text-muted-foreground mt-1">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[2000px]:grid-cols-6 gap-4 2xl:gap-6 animate-pulse">
          {Array.from({ length: 12 }).map((_, i) => (
            <PraktikumCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
