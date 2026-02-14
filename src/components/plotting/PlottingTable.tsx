
'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AsprakPlottingData } from '@/lib/fetchers/asprakFetcher';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PlottingTableProps {
  data: AsprakPlottingData[];
  loading: boolean;
  term?: string;
}

export default function PlottingTable({
  data,
  loading,
  term,
}: PlottingTableProps) {
  const columns = useMemo<ColumnDef<AsprakPlottingData>[]>(
    () => [
      {
        accessorKey: 'nim',
        header: 'NIM',
        cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.nim}</span>
      },
      {
        accessorKey: 'kode',
        header: 'Kode',
        cell: ({ row }) => <Badge variant="outline" className="font-mono">{row.original.kode}</Badge>,
      },
      {
        accessorKey: 'nama_lengkap',
        header: 'Nama Lengkap',
        cell: ({ row }) => <span className="font-medium">{row.original.nama_lengkap}</span>
      },
      {
        id: 'assignments',
        header: 'Assigned Courses',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {row.original.assignments.length > 0 ? (
              row.original.assignments.map((a, i) => (
                <Badge key={`${a.id}-${i}`} variant="secondary" className="hover:bg-primary/20 transition-colors cursor-default">
                  {a.nama}
                  {(term === 'all' || !term) && (
                    <span className="ml-1 text-[10px] opacity-60 font-mono">({a.tahun_ajaran})</span>
                  )}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm italic opacity-50">-</span>
            )}
          </div>
        ),
      },
    ],
    [term]
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
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        Loading data...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-background">
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} records found.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
