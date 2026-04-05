'use client';

import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Edit, Trash2, FilterX } from 'lucide-react';
import { JadwalPengganti } from '@/types/database';
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
import { Skeleton } from '@/components/ui/skeleton';

interface JadwalPenggantiTableProps {
  data: any[];
  loading: boolean;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}

const DAY_ORDER: Record<string, number> = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
  Minggu: 7,
};

const formatTime = (time: string | undefined | null) => {
  if (!time) return '-';
  const startTime = time.split('-')[0].trim();
  const parts = startTime.split(':');
  if (parts.length >= 2) {
    const hh = parts[0].trim().padStart(2, '0');
    const mm = parts[1].trim().padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return startTime;
};

export default function JadwalPenggantiTable({
  data,
  loading,
  onEdit,
  onDelete,
}: JadwalPenggantiTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'mata_kuliah',
        header: 'Mata Kuliah',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-medium">{item.jadwal?.mata_kuliah?.nama_lengkap}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {item.jadwal?.mata_kuliah?.praktikum?.nama}
              </span>
            </div>
          );
        },
      },
      {
        id: 'kelas',
        header: 'Kelas',
        cell: ({ row }) => (
          <Badge variant="outline" className="bg-background">
            {row.original.jadwal?.kelas}
          </Badge>
        ),
      },
      {
        accessorKey: 'modul',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 hover:bg-transparent"
          >
            Modul
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
            Modul {row.original.modul}
          </Badge>
        ),
      },
      {
        id: 'jadwal_asli',
        header: 'Jadwal Asli',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">
                {item.jadwal?.hari}, {formatTime(item.jadwal?.jam)}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-medium">
                <span>SESI {item.jadwal?.sesi || '-'}</span>
                <span>•</span>
                <span>{item.jadwal?.ruangan || 'N/A'}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'hari',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 hover:bg-transparent whitespace-nowrap"
          >
            Hari Pengganti
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        sortingFn: (rowA, rowB) => {
          const dayA = rowA.original.hari || '';
          const dayB = rowB.original.hari || '';
          return (DAY_ORDER[dayA] || 99) - (DAY_ORDER[dayB] || 99);
        },
        cell: ({ row }) => <span className="font-medium text-primary">{row.original.hari}</span>,
      },
      {
        accessorKey: 'jam',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4 hover:bg-transparent whitespace-nowrap"
          >
            Jam Pengganti
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-primary">{formatTime(row.original.jam)}</span>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-medium">
              <span>SESI {row.original.sesi}</span>
              <span className="text-primary/50">•</span>
              <span className="text-primary/80">{row.original.ruangan}</span>
            </div>
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex justify-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(item)}
                className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item.id)}
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              {Array.from({ length: 7 }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-6 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm p-48 text-center text-muted-foreground">
        <div className="flex flex-col items-center justify-center gap-2">
          <FilterX size={40} className="opacity-20" />
          <p>Tidak ada jadwal pengganti ditemukan untuk term ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
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
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/20 transition-colors group">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
