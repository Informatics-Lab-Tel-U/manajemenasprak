import { Skeleton } from '@/components/ui/skeleton';

function JadwalTableSkeleton() {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-muted/50 border-b border-border">
          <th className="p-2 border-r border-border text-center min-w-[60px]">
            <Skeleton className="h-4 w-8 mx-auto" />
          </th>
          <th className="p-2 border-r border-border text-center min-w-[60px]">
            <Skeleton className="h-4 w-8 mx-auto" />
          </th>
          {Array.from({ length: 4 }).map((_, i) => (
            <th key={i} className="p-2 border-r border-border text-center min-w-[120px]">
              <Skeleton className="h-4 w-16 mx-auto" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 15 }).map((_, i) => (
          <tr key={i} className="border-b border-border/50">
            {i % 3 === 0 && (
              <td rowSpan={3} className="p-2 border-r border-border bg-muted/5 text-center">
                <Skeleton className="h-4 w-12 mx-auto" />
              </td>
            )}
            <td className="p-2 border-r border-border text-center">
              <Skeleton className="h-3 w-10 mx-auto" />
            </td>
            {Array.from({ length: 4 }).map((_, j) => (
              <td key={j} className="p-2 border-r border-border align-top">
                <div className="flex flex-col gap-1 w-full min-h-[60px] justify-center">
                  {(i + j) % 3 === 0 && <Skeleton className="h-14 w-full rounded-sm" />}
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function JadwalLoading() {
  return (
    <div className="container relative space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Jadwal Praktikum</h1>
            <p className="text-sm text-muted-foreground mt-1">Overview jadwal per ruangan</p>
          </div>
          <div className="bg-muted/50 p-1.5 rounded-lg flex items-center gap-1 border border-border/50">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>

        <div className="flex flex-wrap md:flex-nowrap gap-2 md:gap-3 items-center w-full md:w-auto">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-44" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card/50 min-h-[400px]">
        <JadwalTableSkeleton />
      </div>
    </div>
  );
}
