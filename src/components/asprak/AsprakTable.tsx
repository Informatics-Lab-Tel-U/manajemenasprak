'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Asprak } from '@/types/database';
import { HIDE_ASLAB_YEAR } from '@/constants';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AsprakTableProps {
  data: Asprak[];
  loading: boolean;
  onViewDetails: (asprak: Asprak) => void;
}

function getAslabTerm(angkatan?: number): string {
  if (!angkatan || isNaN(angkatan)) return '';
  const start = (angkatan + 3) % 100;
  const end = (angkatan + 4) % 100;
  return `${start.toString().padStart(2, '0')}${end.toString().padStart(2, '0')}`;
}


export default function AsprakTable({ data, loading, onViewDetails }: AsprakTableProps) {
  const columns = useMemo<ColumnDef<Asprak>[]>(
    () => [
      {
        accessorKey: 'nim',
        header: 'NIM',
      },
      {
        accessorKey: 'nama_lengkap',
        header: 'Nama Lengkap',
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const role = row.original.role;
          if (role === 'ASLAB') {
            const term = getAslabTerm(row.original.angkatan);
            return (
              <Badge
                title={`Asisten Laboratorium periode ${term}`}
                aria-label={`Asisten Laboratorium periode ${term}`}
                className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-bold px-2 py-0.5"
              >
                ASLAB {!HIDE_ASLAB_YEAR && term}
              </Badge>
            );
          }
          return (
            <span className="text-muted-foreground font-medium text-xs border border-border px-2 py-1 rounded bg-muted/20">
              {role || 'ASPRAK'}
            </span>
          );
        },
      },
      {
        accessorKey: 'kode',
        header: 'Kode',
        cell: ({ row }) => (
          <Badge variant="default" className="font-mono">
            {row.original.kode}
          </Badge>
        ),
      },
      {
        accessorKey: 'angkatan',
        header: 'Angkatan',
      },
      {
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" onClick={() => onViewDetails(row.original)}>
            Lihat <ArrowUpRight className="ml-1" size={14} />
          </Button>
        ),
      },
    ],
    [onViewDetails]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading) {
    return <TableSkeleton columnCount={6} rowCount={10} hasActions={true} />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Data tidak ditemukan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <p className="text-sm font-medium whitespace-nowrap">Baris per halaman</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-full sm:w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectGroup>
                {[10, 20, 30, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex w-full sm:w-auto sm:min-w-[120px] items-center justify-center text-sm font-medium order-3 sm:order-none">
            Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
          </div>
          <div className="flex gap-2 justify-between sm:justify-end sm:gap-2 order-2 sm:order-none sm:ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="flex-1 sm:flex-none"
            >
              <ChevronLeft className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline ml-1">Sebelumnya</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Berikutnya</span>
              <ChevronRight className="h-4 w-4 flex-shrink-0 sm:ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
