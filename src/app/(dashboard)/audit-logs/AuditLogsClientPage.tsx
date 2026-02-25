'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, Search, FilterX, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuditLogWithUser } from '@/types/database';

interface Props {
  logs: AuditLogWithUser[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export default function AuditLogsClientPage({ 
  logs: initialLogs, 
  totalCount, 
  currentPage, 
  pageSize 
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedLog, setSelectedLog] = React.useState<AuditLogWithUser | null>(null);

  const filteredLogs = React.useMemo(() => {
    if (!searchTerm) return initialLogs;
    const lowerSearch = searchTerm.toLowerCase();
    return initialLogs.filter(
      (log) =>
        log.table_name.toLowerCase().includes(lowerSearch) ||
        log.operation.toLowerCase().includes(lowerSearch) ||
        log.pengguna?.nama_lengkap.toLowerCase().includes(lowerSearch)
    );
  }, [initialLogs, searchTerm]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handlePageSizeChange = (newPageSize: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('pageSize', newPageSize);
    params.set('page', '1'); // Reset to first page on size change
    router.push(`?${params.toString()}`);
  };

  const getOperationBadge = (operation: string) => {
    switch (operation.toUpperCase()) {
      case 'INSERT':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">INSERT</Badge>;
      case 'UPDATE':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">UPDATE</Badge>;
      case 'DELETE':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">DELETE</Badge>;
      default:
        return <Badge variant="outline">{operation}</Badge>;
    }
  };

  const columns = React.useMemo<ColumnDef<AuditLogWithUser>[]>(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Waktu',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {new Date(row.original.created_at).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        ),
      },
      {
        id: 'user',
        header: 'User',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.pengguna?.nama_lengkap ?? 'System'}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.pengguna?.role ?? 'ACTION_SYSTEM'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'table_name',
        header: 'Tabel',
        cell: ({ row }) => (
          <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
            {row.original.table_name}
          </code>
        ),
      },
      {
        accessorKey: 'operation',
        header: 'Operasi',
        cell: ({ row }) => getOperationBadge(row.original.operation),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedLog(row.original)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredLogs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <div className="container" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="title-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            Audit Logs
          </h1>
          <p className="text-muted-foreground">Riwayat aktifitas dan perubahan data dalam sistem</p>
        </div>
      </div>

      <div className="card glass p-6" style={{ marginBottom: '2rem' }}>
        <div className="flex justify-between items-center mb-6">
           <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari tabel, operasi, atau user..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border mb-4">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FilterX className="h-8 w-8 opacity-20" />
                      <p>Tidak ada data audit log yang ditemukan.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[10, 20, 30, 50].map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {currentPage} of {totalPages || 1}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Detail Perubahan</DialogTitle>
            <DialogDescription>
              Detail data untuk record {selectedLog?.record_id} pada tabel {selectedLog?.table_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Data Lama</h4>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-64">
                  {JSON.stringify(selectedLog?.old_values, null, 2) || '// Tidak ada data lama'}
                </pre>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Data Baru</h4>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-64">
                  {JSON.stringify(selectedLog?.new_values, null, 2) || '// Tidak ada data baru'}
                </pre>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setSelectedLog(null)}>Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
