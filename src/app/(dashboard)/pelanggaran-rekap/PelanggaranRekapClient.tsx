'use client';

import * as React from 'react';
import { Filter, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { fetchPelanggaranSummary } from '@/lib/fetchers/pelanggaranFetcher';
import type { PelanggaranSummaryEntry } from '@/services/pelanggaranService';
import type { Role } from '@/config/rbac';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useTermStore } from '@/store/useTermStore';

interface Props {
  initialTahunAjaranList: string[];
  userRole: Role;
}

export default function PelanggaranRekapClient({ initialTahunAjaranList }: Props) {
  const { activeTerm } = useTermStore();
  const tahunAjaran = activeTerm || '';
  const [modul, setModul] = React.useState<string>('all');
  const [minCount, setMinCount] = React.useState<number>(1);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<PelanggaranSummaryEntry[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  React.useEffect(() => {
    setMounted(true);
    if (initialTahunAjaranList[0]) {
      handleFetch(initialTahunAjaranList[0], 'all', 1);
    }
  }, [initialTahunAjaranList]);

  async function handleFetch(t: string, m: string, c: number) {
    setLoading(true);
    try {
      const modulVal = m === 'all' ? 0 : Number(m);
      const res = await fetchPelanggaranSummary(t, modulVal, c);
      if (res.ok) {
        setData(res.data || []);
      } else {
        toast.error(res.error || 'Gagal mengambil data rekap');
      }
    } finally {
      setLoading(false);
    }
  }

  const loadData = () => handleFetch(tahunAjaran, modul, minCount);

  const flatViolations = React.useMemo(() => {
    return data.flatMap((entry) =>
      (entry.violations || []).map((v) => ({
        ...v,
        _kode_asprak: entry.kode_asprak,
        _nama_asprak: entry.nama_asprak,
      }))
    );
  }, [data]);

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.jadwal?.mata_kuliah?.praktikum?.nama ?? '—',
        id: 'mk',
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground transition-colors font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            MK
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="font-medium truncate max-w-[200px]">
            {row.getValue('mk')}
          </div>
        ),
      },
      {
        accessorFn: (row) => row._kode_asprak,
        id: 'asprak',
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer select-none hover:text-foreground transition-colors font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Kode Asprak
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs font-semibold">
              {row.getValue('asprak')}
            </span>
            <div className="text-xs text-muted-foreground truncate max-w-[180px]">
              {row.original._nama_asprak}
            </div>
          </div>
        ),
      },
      {
        accessorFn: (row) => row.jadwal?.kelas ?? '—',
        id: 'kelas',
        header: () => <div className="text-center">Kelas</div>,
        cell: ({ row }) => <div className="text-center text-sm">{row.getValue('kelas')}</div>,
      },
      {
        accessorKey: 'jenis',
        header: 'Jenis',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs font-normal whitespace-nowrap">
            {row.original.jenis}
          </Badge>
        ),
      },
      {
        accessorKey: 'modul',
        header: () => <div className="text-center">Modul</div>,
        cell: ({ row }) => <div className="text-center text-sm">{row.getValue('modul') ?? '—'}</div>,
      },
      {
        accessorFn: (row) => row.jadwal?.jam ?? '—',
        id: 'jam',
        header: () => <div className="text-center">Jam</div>,
        cell: ({ row }) => (
          <div className="text-center text-sm text-muted-foreground">{row.getValue('jam')}</div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: flatViolations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (!mounted) return null;

  return (
    <div className="container relative space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Pelanggaran Asprak</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Agregasi data pelanggaran asisten praktikum lintas praktikum
          </p>
        </div>
      </div>

      {/* Filters Accordion */}
      <Accordion type="single" collapsible defaultValue="filter" className="w-full">
        <AccordionItem value="filter" className="border rounded-xl px-4 bg-card/30">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <Filter size={20} className="text-muted-foreground" />
              <div className="text-left">
                <h3 className="font-semibold text-base">Filter Parameter</h3>
                <p className="text-sm font-normal text-muted-foreground">
                  Sesuaikan data rekap pelanggaran yang ingin ditampilkan.
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">


              <label className="space-y-1.5 block">
                <span className="text-xs font-medium text-muted-foreground">Target Modul</span>
                <Select value={modul} onValueChange={setModul}>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Pilih Modul" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Modul</SelectItem>
                    {Array.from({ length: 16 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        Modul {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs font-medium text-muted-foreground">
                  Min. Pelanggaran
                </span>
                <Input
                  type="number"
                  min={1}
                  value={minCount}
                  onChange={(e) => setMinCount(Number(e.target.value))}
                  className="h-9 w-full"
                />
              </label>

              <Button onClick={loadData} disabled={loading} className="h-9">
                {loading ? (
                  <Spinner className="h-4 w-4 mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Tampilkan
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Results Table */}
      <div className="card glass border border-border/50 overflow-hidden space-y-4">
            <div className="px-6 py-4 flex items-center justify-between border-b border-border/50 bg-muted/20">
              <h3 className="font-semibold text-sm">Daftar Pelanggaran</h3>
              <Badge variant="secondary">{flatViolations.length} records</Badge>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="rounded-md border overflow-hidden">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="whitespace-nowrap">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /><Skeleton className="h-3 w-20 mt-1 opacity-50" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="text-sm">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-48 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-1">
                            <p className="text-sm">Tidak ada data pelanggaran yang ditemukan.</p>
                            <p className="text-xs opacity-60">Coba sesuaikan filter pencarian Anda</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {!loading && flatViolations.length > 0 && (
                <div className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between px-1">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <p className="text-sm font-medium whitespace-nowrap">Baris per halaman</p>
                    <Select
                      value={`${table.getState().pagination.pageSize}`}
                      onValueChange={(value) => {
                        table.setPageSize(Number(value));
                      }}
                    >
                      <SelectTrigger className="h-8 w-full sm:w-[90px]">
                        <SelectValue placeholder={table.getState().pagination.pageSize} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 20, 30, 50, 100].map((pageSize) => (
                          <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                          </SelectItem>
                        ))}
                        <SelectItem value="10000">Semua</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-end">
                    <div className="flex w-full sm:w-auto sm:min-w-[120px] items-center justify-center text-sm font-medium order-3 sm:order-none">
                      Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount() || 1}
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
              )}
            </div>
      </div>
    </div>
  );
}
