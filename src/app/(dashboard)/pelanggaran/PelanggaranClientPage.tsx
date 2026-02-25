'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, AlertTriangle, CheckCircle2, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { createPelanggaran, finalizePelanggaranByMataKuliah } from '@/services/pelanggaranService';
import type { Pelanggaran, AsprakKoordinator } from '@/types/database';
import type { Role } from '@/config/rbac';

interface Props {
  violations: Pelanggaran[];
  role: Role;
  koorAssignments: AsprakKoordinator[];
}

export default function PelanggaranClientPage({ violations, role, koorAssignments }: Props) {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [finalizeTarget, setFinalizeTarget] = React.useState<AsprakKoordinator | null>(null);
  const [isFinalizing, setIsFinalizing] = React.useState(false);

  const isAdminOrAslab = role === 'ADMIN' || role === 'ASLAB';
  const isKoor = role === 'ASPRAK_KOOR';

  // Determine which matkul IDs are fully finalized (all their pelanggaran have is_final = true)
  const finalizedMkIds = React.useMemo(() => {
    const byMk = new Map<string, Pelanggaran[]>();
    for (const v of violations) {
      const mkId = v.jadwal?.mata_kuliah?.id;
      if (!mkId) continue;
      if (!byMk.has(mkId)) byMk.set(mkId, []);
      byMk.get(mkId)!.push(v);
    }

    const finalized = new Set<string>();
    for (const [mkId, records] of byMk) {
      if (records.length > 0 && records.every((r) => r.is_final)) {
        finalized.add(mkId);
      }
    }
    return finalized;
  }, [violations]);

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
        id: 'mata_kuliah',
        header: 'Mata Kuliah',
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
        accessorKey: 'jenis',
        header: 'Jenis',
      },
      {
        accessorKey: 'modul',
        header: 'Modul',
      },
      {
        accessorKey: 'is_final',
        header: 'Status',
        cell: ({ row }) => (
          row.original.is_final ? (
            <Badge variant="secondary" className="gap-1 text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              Final
            </Badge>
          ) : (
            <Badge variant="outline">Aktif</Badge>
          )
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: violations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  async function handleAddViolation(data: any) {
    setIsSubmitting(true);
    try {
      await createPelanggaran(data);
      toast.success('Pelanggaran berhasil dicatat!');
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
      await finalizePelanggaranByMataKuliah(finalizeTarget.id_mata_kuliah);
      toast.success(
        `Pelanggaran untuk ${finalizeTarget.mata_kuliah?.nama_lengkap ?? 'matkul'} berhasil difinalisasi.`
      );
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal memfinalisasi pelanggaran');
    } finally {
      setIsFinalizing(false);
      setFinalizeTarget(null);
    }
  }

  return (
    <div className="container" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="title-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            Pelanggaran
          </h1>
          <p className="text-muted-foreground">Log indisipliner asisten praktikum</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Catat Pelanggaran
        </Button>
      </div>

      {/* Koor: finalization panel per matkul */}
      {isKoor && koorAssignments.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {koorAssignments.map((assignment) => {
            const isFinalized = finalizedMkIds.has(assignment.id_mata_kuliah);
            const mkViolations = violations.filter(
              (v) => v.jadwal?.mata_kuliah?.id === assignment.id_mata_kuliah
            );

            return (
              <div key={assignment.id} className="card glass p-4 relative overflow-hidden">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold leading-tight">
                    {assignment.mata_kuliah?.nama_lengkap ?? 'Mata Kuliah'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {assignment.mata_kuliah?.program_studi}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-0">
                  <span className="text-2xl font-bold">{mkViolations.length}</span>
                  {isFinalized ? (
                    <Badge variant="secondary" className="gap-1 text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Terfinalisasi
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setFinalizeTarget(assignment)}
                      className="gap-1"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Finalisasi
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Section */}
      <div className="card glass p-6" style={{ marginBottom: '2rem' }}>
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
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground py-12">
                    Belum ada data pelanggaran.
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
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
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

      {/* Add Modal */}
      <PelanggaranAddModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddViolation}
        isLoading={isSubmitting}
      />

      {/* Finalize Confirmation */}
      <AlertDialog
        open={!!finalizeTarget}
        onOpenChange={(open) => !open && setFinalizeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalisasi Pelanggaran</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan memfinalisasi semua data pelanggaran untuk{' '}
              <strong>{finalizeTarget?.mata_kuliah?.nama_lengkap}</strong>. Setelah difinalisasi,
              data tidak dapat diubah lagi. Pastikan semua data sudah benar.
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
