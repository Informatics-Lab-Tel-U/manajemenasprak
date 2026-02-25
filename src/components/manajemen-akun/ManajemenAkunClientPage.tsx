'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Shield, ShieldCheck, User, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { ManajemenAkunFormModal } from './ManajemenAkunFormModal';
import type { Pengguna } from '@/types/database';
import type { Role } from '@/config/rbac';

type UserWithEmail = Pengguna & { email: string };

const ROLE_BADGE: Record<Role, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  ADMIN: { label: 'Admin', variant: 'default' },
  ASLAB: { label: 'Aslab', variant: 'secondary' },
  ASPRAK_KOOR: { label: 'Koor Asprak', variant: 'outline' },
};

const ROLE_ICON: Record<Role, React.ElementType> = {
  ADMIN: ShieldCheck,
  ASLAB: Shield,
  ASPRAK_KOOR: User,
};

export function ManajemenAkunClientPage({ users }: { users: UserWithEmail[] }) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<UserWithEmail | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<UserWithEmail | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const columns = React.useMemo<ColumnDef<UserWithEmail>[]>(
    () => [
      {
        accessorKey: 'nama_lengkap',
        header: 'Nama',
        cell: ({ row }) => <span className="font-medium">{row.original.nama_lengkap}</span>,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const badgeCfg = ROLE_BADGE[row.original.role];
          const RoleIcon = ROLE_ICON[row.original.role];
          return (
            <Badge variant={badgeCfg.variant} className="gap-1">
              <RoleIcon className="h-3 w-3" />
              {badgeCfg.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Terdaftar',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {new Date(row.original.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditTarget(row.original)}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTarget(row.original)}
              title="Hapus"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success(`Akun "${deleteTarget.nama_lengkap}" berhasil dihapus.`);
      router.refresh();
    } catch (err: any) {
      toast.error(`Gagal menghapus akun: ${err.message}`);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="container" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="title-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            Manajemen Akun
          </h1>
          <p className="text-muted-foreground">Kelola akun pengguna yang terdaftar di sistem</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Akun
        </Button>
      </div>

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
                    Belum ada akun terdaftar.
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

      {/* Create Modal */}
      <ManajemenAkunFormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        mode="create"
        onSuccess={() => router.refresh()}
      />

      {/* Edit Modal */}
      {editTarget && (
        <ManajemenAkunFormModal
          open={!!editTarget}
          onOpenChange={(open: boolean) => !open && setEditTarget(null)}
          mode="edit"
          user={editTarget}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus akun{' '}
              <strong>{deleteTarget?.nama_lengkap}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
