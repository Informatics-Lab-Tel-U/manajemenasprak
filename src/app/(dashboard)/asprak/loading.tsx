import { TableSkeleton } from '@/components/ui/TableSkeleton';

export default function AsprakLoading() {
  return (
    <div className="container relative space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Data Asisten Praktikum</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola daftar asisten praktikum</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 items-center w-full md:w-auto">
          <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      <div className="w-full">
        <div className="flex gap-4 mb-6 border-b pb-2">
          <div className="h-8 w-24 bg-muted animate-pulse rounded-sm" />
          <div className="h-8 w-24 bg-muted animate-pulse rounded-sm" />
        </div>

        <div className="card glass p-6 space-y-6 border border-border/50">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="h-10 flex-1 w-full bg-muted animate-pulse rounded-md" />
            <div className="h-10 w-full sm:w-[180px] bg-muted animate-pulse rounded-md" />
          </div>
          <TableSkeleton columnCount={5} rowCount={10} />
        </div>
      </div>
    </div>
  );
}
