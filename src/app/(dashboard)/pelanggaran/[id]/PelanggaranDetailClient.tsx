'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowUpDown, CheckCircle2, Download, Lock, Plus, Search,
} from 'lucide-react';
import {
  useReactTable, getCoreRowModel, getPaginationRowModel,
  getSortedRowModel, getFilteredRowModel,
  flexRender, type ColumnDef, type SortingState, type ColumnFiltersState,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import PelanggaranAddModal from '@/components/pelanggaran/PelanggaranAddModal';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Pelanggaran, Praktikum } from '@/types/database';
import type { Role } from '@/config/rbac';

import { usePelanggaranDetail } from '@/hooks/usePelanggaran';

interface Props {
  praktikum?: Praktikum;
  initialViolations?: Pelanggaran[];
  initialIsFinalized?: boolean;
  role: Role;
  idPraktikum: string;
}

// ── Recap table: per-asprak breakdown ────────────────────────────
function buildRecap(violations: Pelanggaran[]) {
  const map = new Map<string, { kode: string; nama: string; counts: Record<string, number>; total: number }>();
  for (const v of violations) {
    const id = v.id_asprak;
    if (!id) continue;
    if (!map.has(id)) {
      map.set(id, {
        kode: v.asprak?.kode ?? '—',
        nama: v.asprak?.nama_lengkap ?? '—',
        counts: {},
        total: 0,
      });
    }
    const entry = map.get(id)!;
    entry.counts[v.jenis] = (entry.counts[v.jenis] ?? 0) + 1;
    entry.total += 1;
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

// ── Sort button helper ────────────────────────────────────────────
function SortHeader({ column, label }: { column: any; label: string }) {
  return (
    <Button
      variant="ghost" size="sm"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="-ml-3 h-8 gap-1 px-3"
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </Button>
  );
}

export default function PelanggaranDetailClient({
  praktikum: initialPraktikum, initialViolations, initialIsFinalized, role, idPraktikum,
}: Props) {
  const router = useRouter();
  const {
    violations,
    praktikum: hookPraktikum,
    asprakList,
    jadwalList,
    loading,
    error,
    isFinalized,
    refresh,
    addPelanggaran,
    deletePelanggaran,
    finalize,
  } = usePelanggaranDetail(idPraktikum, initialViolations, initialPraktikum);

  // Use praktikum from hook (which includes the one from props as initial state)
  const praktikum = hookPraktikum || initialPraktikum;

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [showFinalize, setShowFinalize] = React.useState(false);
  const [isFinalizing, setIsFinalizing] = React.useState(false);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleAddViolation(data: {
    id_asprak: string[]; id_jadwal: string; jenis: string; modul: number;
  }) {
    setIsSubmitting(true);
    try {
      const result = await addPelanggaran(data);
      if (!result.ok) throw new Error(result.error || 'Gagal mencatat pelanggaran');
      
      toast.success(data.id_asprak.length > 1
        ? `${data.id_asprak.length} pelanggaran berhasil dicatat!`
        : 'Pelanggaran berhasil dicatat!'
      );
      setIsAddOpen(false);
      refresh();
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal mencatat pelanggaran');
    } finally {
      setIsSubmitting(false);
    }
  }

  const canFinalize = (role === 'ADMIN' || role === 'ASLAB' || role === 'ASPRAK_KOOR') && !isFinalized;

  // ── Violation log columns ─────────────────────────────────────
  const columns = React.useMemo<ColumnDef<Pelanggaran>[]>(
    () => [
      {
        accessorKey: 'created_at',
        header: ({ column }) => <SortHeader column={column} label="Tanggal" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {new Date(row.original.created_at).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        ),
      },
      {
        id: 'asprak',
        accessorFn: (v) => `${v.asprak?.nama_lengkap} ${v.asprak?.kode} ${v.asprak?.nim}`,
        header: ({ column }) => <SortHeader column={column} label="Asprak" />,
        cell: ({ row: { original: v } }) => (
          <div>
            <div className="font-medium">{v.asprak?.nama_lengkap ?? '—'}</div>
            <div className="text-xs text-muted-foreground">{v.asprak?.kode} · {v.asprak?.nim}</div>
          </div>
        ),
      },
      {
        id: 'kelas_info',
        header: 'Mata Kuliah / Kelas',
        cell: ({ row: { original: v } }) => (
          <div>
            <div>{v.jadwal?.mata_kuliah?.nama_lengkap ?? '—'}</div>
            <div className="text-xs text-muted-foreground">
              Kelas {v.jadwal?.kelas} · {v.jadwal?.hari}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'modul',
        header: 'Modul',
        cell: ({ row }) => <span>{row.original.modul ? `Modul ${row.original.modul}` : '—'}</span>,
      },
      {
        accessorKey: 'jenis',
        header: ({ column }) => <SortHeader column={column} label="Jenis" />,
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs font-normal whitespace-nowrap">
            {row.original.jenis}
          </Badge>
        ),
      },
      {
        accessorKey: 'is_final',
        header: 'Status',
        cell: ({ row }) =>
          row.original.is_final ? (
            <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3" /> Final
            </Badge>
          ) : (
            <Badge variant="outline">Aktif</Badge>
          ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: violations,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize: 15 } },
  });

  const recap = React.useMemo(() => buildRecap(violations), [violations]);

  const activeJenis = React.useMemo(() => {
    const set = new Set<string>();
    violations.forEach((v) => set.add(v.jenis));
    return Array.from(set).sort();
  }, [violations]);

  async function handleFinalize() {
    setIsFinalizing(true);
    try {
      const result = await finalize();
      if (!result.ok) throw new Error(result.error || 'Gagal finalisasi');
      toast.success(`Pelanggaran ${praktikum?.nama} berhasil difinalisasi.`);
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal finalisasi');
    } finally {
      setIsFinalizing(false);
      setShowFinalize(false);
    }
  }

  function handleExport() {
    const params = new URLSearchParams({ id_praktikum: idPraktikum, tahun_ajaran: praktikum?.tahun_ajaran || '' });
    window.location.href = `/api/pelanggaran/export?${params}`;
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/pelanggaran')}>
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="title-gradient text-3xl font-bold">{praktikum?.nama}</h1>
            <p className="text-muted-foreground text-sm">{praktikum?.tahun_ajaran} · {violations.length} pelanggaran</p>
          </div>
        </div>
        {!isFinalized && (
          <Button onClick={() => setIsAddOpen(true)} size="sm" className="gap-1.5" disabled={loading}>
            <Plus className="h-4 w-4" />
            Catat Pelanggaran
          </Button>
        )}
      </div>

      {/* Search filter */}
      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama / kode asprak..."
            value={(table.getColumn('asprak')?.getFilterValue() as string) ?? ''}
            onChange={(e) => table.getColumn('asprak')?.setFilterValue(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {loading && <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2" />}
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5" disabled={loading}>
            <Download className="h-4 w-4" /> Export
          </Button>
          {canFinalize && (
            <Button size="sm" variant="outline" onClick={() => setShowFinalize(true)} className="gap-1.5" disabled={loading}>
              <Lock className="h-3.5 w-3.5" /> Finalisasi
            </Button>
          )}
          {isFinalized && (
            <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3" /> Terfinalisasi
            </Badge>
          )}
        </div>
      </div>

      {/* Dual table layout */}
      <div className="">
        {/* === Violation Log Table === */}
        <div className="card glass p-4 mb-6">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Log Pelanggaran</h2>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
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
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      {loading ? 'Memuat data...' : 'Belum ada pelanggaran.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-end gap-2 mt-3">
            <span className="text-sm text-muted-foreground">
              Hal {table.getState().pagination.pageIndex + 1}/{Math.max(1, table.getPageCount())}
            </span>
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              ‹ Prev
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next ›
            </Button>
          </div>
        </div>

        {/* === Recap Table === */}
        <div className="card glass p-4">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Rekap per Asprak</h2>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  {activeJenis.map((j) => (
                    <TableHead key={j} className="text-center text-xs whitespace-nowrap">{j}</TableHead>
                  ))}
                  <TableHead className="text-center font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recap.length ? (
                  recap.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{r.kode}</TableCell>
                      <TableCell className="text-sm">{r.nama}</TableCell>
                      {activeJenis.map((j) => (
                        <TableCell key={j} className="text-center text-sm">
                          {r.counts[j] ?? 0}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-bold">{r.total}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3 + activeJenis.length} className="h-16 text-center text-muted-foreground text-sm">
                      Tidak ada data.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Finalize dialog */}
      <AlertDialog open={showFinalize} onOpenChange={(o) => !o && setShowFinalize(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalisasi Pelanggaran</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan memfinalisasi semua pelanggaran untuk{' '}
              <strong>{praktikum?.nama} ({praktikum?.tahun_ajaran})</strong>.
              Setelah difinalisasi, data tidak dapat diubah lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isFinalizing}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalize} disabled={isFinalizing}>
              {isFinalizing ? 'Memfinalisasi...' : 'Ya, Finalisasi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Modal */}
      <PelanggaranAddModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddViolation}
        isLoading={isSubmitting}
        praktikumList={praktikum ? [praktikum] : []}
        tahunAjaranList={praktikum ? [praktikum.tahun_ajaran] : []}
        asprakList={asprakList}
        jadwalList={jadwalList}
      />
    </div>
  );
}
