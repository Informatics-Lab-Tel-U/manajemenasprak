import { Skeleton } from '@/components/ui/skeleton';
import { Filter } from 'lucide-react';
import { PelanggaranCardSkeleton } from '@/components/pelanggaran/PelanggaranCardSkeleton';

export default function PelanggaranLoading() {
  return (
    <div className="container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pelanggaran</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log indisipliner asisten praktikum per praktikum
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <span className="text-sm font-medium text-muted-foreground hidden sm:block">
            Tahun Ajaran:
          </span>
          <Skeleton className="h-10 w-full sm:w-[180px] rounded-md" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <PelanggaranCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
