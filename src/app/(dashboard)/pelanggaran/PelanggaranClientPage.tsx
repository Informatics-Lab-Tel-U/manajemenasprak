'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
} from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PelanggaranAddModal from '@/components/pelanggaran/PelanggaranAddModal';
import type { Pelanggaran, Praktikum, Asprak, Jadwal } from '@/types/database';
import type { Role } from '@/config/rbac';

interface Props {
  violations: Pelanggaran[];
  role: Role;
  /** All available praktikum (scoped by RLS for ASPRAK_KOOR) */
  praktikumList: Praktikum[];
  tahunAjaranList: string[];
  asprakList: (Asprak & { praktikum_ids?: string[] })[];
  jadwalList: (Jadwal & { id_praktikum?: string })[];
}

// Helper: get praktikum key string from a violation record
function getPraktikumKey(v: Pelanggaran): string {
  const mk = v.jadwal?.mata_kuliah as any;
  const idPraktikum = mk?.id_praktikum ?? '';
  const tahunAjaran = mk?.praktikum?.tahun_ajaran ?? '';
  return `${idPraktikum}__${tahunAjaran}`;
}

export default function PelanggaranClientPage({
  violations,
  role,
  praktikumList,
  tahunAjaranList,
  asprakList,
  jadwalList,
}: Props) {
  const router = useRouter();

  // ── Main filter state ──
  const [filterTahun, setFilterTahun] = React.useState(tahunAjaranList[0] ?? '');
  const [filterPraktikumId, setFilterPraktikumId] = React.useState('');

  // ── Modal state ──
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // ── Finalize state ──
  const [finalizeTarget, setFinalizeTarget] = React.useState<{
    id_praktikum: string;
    tahun_ajaran: string;
    nama: string;
  } | null>(null);
  const [isFinalizing, setIsFinalizing] = React.useState(false);

  const isAdminOrAslab = role === 'ADMIN' || role === 'ASLAB';
  const isKoor = role === 'ASPRAK_KOOR';

  // Praktikum filtered by selected tahun
  const filteredPraktikumList = React.useMemo(() => {
    if (!filterTahun) return praktikumList;
    return praktikumList.filter((p) => p.tahun_ajaran === filterTahun);
  }, [praktikumList, filterTahun]);

  // Violations filtered by active filters
  const filteredViolations = React.useMemo(() => {
    return violations.filter((v) => {
      const mk = v.jadwal?.mata_kuliah as any;
      if (filterTahun && mk?.praktikum?.tahun_ajaran !== filterTahun) return false;
      if (filterPraktikumId && mk?.id_praktikum !== filterPraktikumId) return false;
      return true;
    });
  }, [violations, filterTahun, filterPraktikumId]);

  // Determine which praktikum+tahun combos are fully finalized
  const finalizedKeys = React.useMemo(() => {
    const byKey = new Map<string, Pelanggaran[]>();
    for (const v of filteredViolations) {
      const key = getPraktikumKey(v);
      if (!key.includes('__')) continue;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(v);
    }
    const finalized = new Set<string>();
    for (const [key, records] of byKey) {
      if (records.length > 0 && records.every((r) => r.is_final)) {
        finalized.add(key);
      }
    }
    return finalized;
  }, [filteredViolations]);

  // Build finalize summary cards: one per praktikum
  const finalizeSummary = React.useMemo(() => {
    const scope = filterPraktikumId
      ? filteredPraktikumList.filter((p) => p.id === filterPraktikumId)
      : filteredPraktikumList;

    return scope.map((p) => {
      const key = `${p.id}__${p.tahun_ajaran}`;
      const count = filteredViolations.filter((v) => getPraktikumKey(v) === key).length;
      return {
        id_praktikum: p.id,
        tahun_ajaran: p.tahun_ajaran,
        nama: p.nama,
        key,
        count,
        isFinalized: finalizedKeys.has(key),
      };
    });
  }, [filteredPraktikumList, filteredViolations, finalizedKeys, filterPraktikumId]);

  const columns = React.useMemo<ColumnDef<Pelanggaran>[]>(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Tanggal',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {new Date(row.original.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ),
      },
      {
        id: 'asprak',
        header: 'Asprak',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.asprak?.nama_lengkap ?? '—'}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.asprak?.kode} · {row.original.asprak?.nim}
            </div>
          </div>
        ),
      },
      {
        id: 'kelas_info',
        header: 'Mata Kuliah / Kelas',
        cell: ({ row }) => (
          <div>
            <div>{row.original.jadwal?.mata_kuliah?.nama_lengkap ?? '—'}</div>
            <div className="text-xs text-muted-foreground">
              Kelas {row.original.jadwal?.kelas} · {row.original.jadwal?.hari}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'modul',
        header: 'Modul',
        cell: ({ row }) => (
          <span>{row.original.modul ? `Modul ${row.original.modul}` : '—'}</span>
        ),
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
        accessorKey: 'is_final',
        header: 'Status',
        cell: ({ row }) =>
          row.original.is_final ? (
            <Badge
              variant="secondary"
              className="gap-1 text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
            >
              <CheckCircle2 className="h-3 w-3" />
              Final
            </Badge>
          ) : (
            <Badge variant="outline">Aktif</Badge>
          ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredViolations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  async function handleAddViolation(data: {
    id_asprak: string[];
    id_jadwal: string;
    jenis: string;
    modul: number | null;
  }) {
    setIsSubmitting(true);
    try {
      const resp = await fetch('/api/pelanggaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_asprak: data.id_asprak,
          id_jadwal: data.id_jadwal,
          jenis: data.jenis,
          modul: data.modul,
        }),
      });
      const res = await resp.json();
      if (!res.ok) throw new Error(res.error || 'Gagal mencatat pelanggaran');

      const count = data.id_asprak.length;
      toast.success(
        count > 1
          ? `${count} pelanggaran berhasil dicatat!`
          : 'Pelanggaran berhasil dicatat!'
      );
      setIsAddOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal mencatat pelanggaran');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFinalize() {
    if (!finalizeTarget) return;
    setIsFinalizing(true);
    try {
      const resp = await fetch('/api/pelanggaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'finalize',
          id_praktikum: finalizeTarget.id_praktikum,
          tahun_ajaran: finalizeTarget.tahun_ajaran,
        }),
      });
      const res = await resp.json();
      if (!res.ok) throw new Error(res.error || 'Gagal memfinalisasi pelanggaran');
      toast.success(`Pelanggaran ${finalizeTarget.nama} berhasil difinalisasi.`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal memfinalisasi pelanggaran');
    } finally {
      setIsFinalizing(false);
      setFinalizeTarget(null);
    }
  }

  function handleExport() {
    const params = new URLSearchParams();
    if (filterPraktikumId) params.set('id_praktikum', filterPraktikumId);
    if (filterTahun) params.set('tahun_ajaran', filterTahun);
    window.location.href = `/api/pelanggaran/export?${params.toString()}`;
  }

  return (
    <div className="container" style={{ position: 'relative' }}>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="title-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            Pelanggaran
          </h1>
          <p className="text-muted-foreground">Log indisipliner asisten praktikum</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          <Button onClick={() => setIsAddOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Catat Pelanggaran
          </Button>
        </div>
      </div>

      {/* ── Main Filters ── */}
      <div className="card glass p-4 mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filter:
        </div>
        <Select
          value={filterTahun}
          onValueChange={(v) => {
            setFilterTahun(v);
            setFilterPraktikumId('');
          }}
        >
          <SelectTrigger className="h-8 w-[160px] text-sm">
            <SelectValue placeholder="Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {tahunAjaranList.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={filterPraktikumId || 'all'}
          onValueChange={(v) => setFilterPraktikumId(v === 'all' ? '' : v)}
          disabled={!filterTahun}
        >
          <SelectTrigger className="h-8 w-[220px] text-sm">
            <SelectValue placeholder="Nama Praktikum" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Semua Praktikum</SelectItem>
              {filteredPraktikumList.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nama}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground ml-auto">
          {filteredViolations.length} pelanggaran
        </span>
      </div>

      {/* ── Finalize Cards (one per aktif praktikum) ── */}
      {finalizeSummary.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          {finalizeSummary.map((item) => (
            <div key={item.key} className="card glass p-4 relative overflow-hidden">
              <div className="mb-3">
                <h3 className="text-sm font-semibold leading-tight">{item.nama}</h3>
                <p className="text-xs text-muted-foreground">{item.tahun_ajaran}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{item.count}</span>
                {item.isFinalized ? (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Terfinalisasi
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setFinalizeTarget({
                        id_praktikum: item.id_praktikum,
                        tahun_ajaran: item.tahun_ajaran,
                        nama: item.nama,
                      })
                    }
                    className="gap-1"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Finalisasi
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ── */}
      <div className="card glass p-6 mb-8">
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
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-muted-foreground py-12"
                  >
                    Belum ada data pelanggaran untuk filter ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Baris per halaman</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
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

          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex w-[120px] items-center justify-center text-sm font-medium">
              Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
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

      {/* ── Add Modal ── */}
      <PelanggaranAddModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddViolation}
        isLoading={isSubmitting}
        praktikumList={praktikumList}
        tahunAjaranList={tahunAjaranList}
        asprakList={asprakList}
        jadwalList={jadwalList}
      />

      {/* ── Finalize Confirmation ── */}
      <AlertDialog
        open={!!finalizeTarget}
        onOpenChange={(open) => !open && setFinalizeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalisasi Pelanggaran</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan memfinalisasi semua data pelanggaran untuk{' '}
              <strong>
                {finalizeTarget?.nama} ({finalizeTarget?.tahun_ajaran})
              </strong>
              . Setelah difinalisasi, data tidak dapat diubah lagi. Pastikan semua data sudah
              benar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isFinalizing}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalize} disabled={isFinalizing}>
              {isFinalizing ? 'Memfinalisasi...' : 'Ya, Finalisasi Sekarang'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
