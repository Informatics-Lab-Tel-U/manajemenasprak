import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AuditLogsLoading() {
  return (
    <div className="container relative space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Riwayat aktifitas dan perubahan data dalam sistem
          </p>
        </div>
      </div>

      <div className="card glass p-6 border border-border/50">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari tabel, operasi, atau user..." className="pl-9" disabled />
          </div>
        </div>

        <div className="rounded-md border mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Tabel</TableHead>
                <TableHead>Operasi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-36" />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls Skeleton */}
        <div className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between font-medium">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-16" />
          </div>

          <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex w-full sm:w-auto sm:min-w-[120px] items-center justify-center order-3 sm:order-none">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex gap-2 justify-between sm:justify-end sm:gap-2 order-2 sm:order-none sm:ml-4">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Sebelumnya
              </Button>
              <Button variant="outline" size="sm" disabled>
                Berikutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
