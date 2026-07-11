'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Database, ListFilter, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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

type PraktikanRecord = {
  id: string | number;
  created_at?: string;
  nama: string;
  kelas: string;
  kode_asprak: string | null;
  mata_kuliah: string;
};

type PraktikanOptions = {
  kelas: string[];
  mata_kuliah: string[];
};

const ALL_KELAS_VALUE = '__all_kelas__';
const ALL_MATA_KULIAH_VALUE = '__all_mata_kuliah__';
const NO_DELETE_VALUE = '__no_delete__';

export default function DataPraktikanViewPage() {
  const [rows, setRows] = useState<PraktikanRecord[]>([]);
  const [options, setOptions] = useState<PraktikanOptions>({ kelas: [], mata_kuliah: [] });
  const [query, setQuery] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [mataKuliahFilter, setMataKuliahFilter] = useState('');
  const [kelasToDelete, setKelasToDelete] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<PraktikanRecord | null>(null);
  const [editingRow, setEditingRow] = useState<PraktikanRecord | null>(null);
  const [editForm, setEditForm] = useState({
    nama: '',
    kelas: '',
    mata_kuliah: '',
    kode_asprak: '',
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingPerson, setDeletingPerson] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (kelasFilter.trim()) params.set('kelas', kelasFilter.trim());
      if (mataKuliahFilter.trim()) params.set('mata_kuliah', mataKuliahFilter.trim());

      const response = await fetch(`/api/praktikan?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Gagal mengambil data praktikan.');
      }

      setRows(result.data ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengambil data praktikan.');
    } finally {
      setLoading(false);
    }
  }, [kelasFilter, mataKuliahFilter]);

  const fetchOptions = useCallback(async () => {
    try {
      const mataKuliahResponse = await fetch('/api/praktikan/mata-kuliah');
      const mataKuliahResult = await mataKuliahResponse.json();

      if (!mataKuliahResponse.ok || !mataKuliahResult.ok) {
        throw new Error(mataKuliahResult.error || 'Gagal mengambil opsi mata kuliah.');
      }

      let kelas: string[] = [];
      if (mataKuliahFilter.trim()) {
        const params = new URLSearchParams({ mata_kuliah: mataKuliahFilter.trim() });
        const kelasResponse = await fetch(`/api/praktikan/kelas?${params.toString()}`);
        const kelasResult = await kelasResponse.json();

        if (!kelasResponse.ok || !kelasResult.ok) {
          throw new Error(kelasResult.error || 'Gagal mengambil opsi kelas.');
        }

        kelas = kelasResult.data ?? [];
      }

      setOptions({
        kelas,
        mata_kuliah: mataKuliahResult.data ?? [],
      });

      if (kelasFilter && !kelas.includes(kelasFilter)) setKelasFilter('');
      if (kelasToDelete && !kelas.includes(kelasToDelete)) setKelasToDelete('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengambil opsi data praktikan.');
    }
  }, [kelasFilter, kelasToDelete, mataKuliahFilter]);

  useEffect(() => {
    fetchRows();
    fetchOptions();
  }, [fetchOptions, fetchRows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rows;

    return rows.filter((row) =>
      [row.nama, row.kelas, row.kode_asprak ?? '', row.mata_kuliah].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [query, rows]);

  const stats = useMemo(() => {
    const uniqueAsprak = new Set(rows.flatMap((row) => row.kode_asprak ? [row.kode_asprak] : [])).size;
    const uniqueKelas = new Set(rows.flatMap((row) => row.kelas ? [row.kelas] : [])).size;
    return { total: rows.length, uniqueAsprak, uniqueKelas };
  }, [rows]);

  const kelasDeleteOptions = useMemo(
    () => Array.from(new Set(rows.flatMap((row) => row.kelas ? [row.kelas] : []))).sort(),
    [rows]
  );

  const handleDeletePerson = async () => {
    if (!personToDelete) return;

    setDeletingPerson(true);
    try {
      const response = await fetch(
        `/api/praktikan?id=${encodeURIComponent(String(personToDelete.id))}`,
        {
          method: 'DELETE',
        }
      );
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Gagal menghapus data praktikan.');
      }

      toast.success('Data praktikan dihapus.');
      setPersonToDelete(null);
      fetchRows();
      fetchOptions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus data praktikan.');
    } finally {
      setDeletingPerson(false);
    }
  };

  const handleDeleteByKelas = async () => {
    if (!kelasToDelete) {
      toast.error('Pilih kelas terlebih dahulu.');
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/praktikan?kelas=${encodeURIComponent(String(kelasToDelete))}`,
        { method: 'DELETE' }
      );
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Gagal menghapus data praktikan.');
      }

      toast.success(`${result.data?.deleted ?? 0} data dari kelas ${kelasToDelete} dihapus.`);
      setKelasToDelete('');
      setDeleteConfirmOpen(false);
      fetchRows();
      fetchOptions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus data praktikan.');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (row: PraktikanRecord) => {
    setEditingRow(row);
    setEditForm({
      nama: row.nama,
      kelas: row.kelas,
      mata_kuliah: row.mata_kuliah,
      kode_asprak: row.kode_asprak ?? '',
    });
  };

  const handleUpdatePraktikan = async () => {
    if (!editingRow) return;

    const payload = {
      nama: editForm.nama.trim(),
      kelas: editForm.kelas.trim(),
      mata_kuliah: editForm.mata_kuliah.trim(),
      kode_asprak: editForm.kode_asprak.trim(),
    };

    if (!payload.nama || !payload.kelas || !payload.mata_kuliah) {
      toast.error('Nama, kelas, dan mata kuliah wajib diisi.');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch('/api/praktikan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingRow.id, data: payload }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Gagal memperbarui data praktikan.');
      }

      toast.success('Data praktikan diperbarui.');
      setEditingRow(null);
      fetchRows();
      fetchOptions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memperbarui data praktikan.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="container space-y-8">
      <header className="overflow-hidden rounded-2xl border bg-[linear-gradient(135deg,hsl(var(--background)),rgba(16,185,129,0.10))] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-3 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
              Database Praktikan
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight">Lihat Data Praktikan</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Cari, filter, edit, dan hapus data praktikan yang sudah tersimpan di Supabase.
            </p>
          </div>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/data-praktikan/input">
              <Plus size={16} />
              Input Data
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{stats.total}</p>
        </div>
        <div className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Kelas</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{stats.uniqueKelas}</p>
        </div>
        <div className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Asprak
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{stats.uniqueAsprak}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="border-b bg-muted/20 p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-emerald-600 text-white">
              <ListFilter size={17} />
            </span>
            <div>
              <h2 className="font-semibold">Filter dan Aksi</h2>
              <p className="text-sm text-muted-foreground">
                Gunakan filter untuk membatasi data sebelum melakukan aksi bulk.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, kelas, mata kuliah, atau kode asprak"
              className="h-11 bg-background xl:min-w-[320px] xl:flex-1"
            />
            <Select
              value={mataKuliahFilter || ALL_MATA_KULIAH_VALUE}
              onValueChange={(value) =>
                setMataKuliahFilter(value === ALL_MATA_KULIAH_VALUE ? '' : value)
              }
            >
              <SelectTrigger className="h-11 bg-background xl:w-[210px]">
                <SelectValue placeholder="Semua mata kuliah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MATA_KULIAH_VALUE}>Semua mata kuliah</SelectItem>
                {options.mata_kuliah.map((mataKuliah) => (
                  <SelectItem key={mataKuliah} value={mataKuliah}>
                    {mataKuliah}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={kelasFilter || ALL_KELAS_VALUE}
              onValueChange={(value) => setKelasFilter(value === ALL_KELAS_VALUE ? '' : value)}
              disabled={!mataKuliahFilter}
            >
              <SelectTrigger className="h-11 bg-background xl:w-[190px]">
                <SelectValue placeholder={mataKuliahFilter ? 'Semua kelas' : 'Pilih mata kuliah'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_KELAS_VALUE}>Semua kelas</SelectItem>
                {options.kelas.map((kelas) => (
                  <SelectItem key={kelas} value={kelas}>
                    {kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={fetchRows}
              disabled={loading}
              className="h-11 xl:shrink-0"
            >
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
              Filter
            </Button>
            <Select
              value={kelasToDelete || NO_DELETE_VALUE}
              onValueChange={(value) => setKelasToDelete(value === NO_DELETE_VALUE ? '' : value)}
            >
              <SelectTrigger className="h-11 border-red-200 bg-background text-red-700 dark:border-red-900/70 dark:text-red-300 xl:w-[210px]">
                <SelectValue placeholder="Bulk delete kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_DELETE_VALUE}>Bulk delete kelas</SelectItem>
                {kelasDeleteOptions.map((kelas) => (
                  <SelectItem key={kelas} value={kelas}>
                    {kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteConfirmOpen(true);
              }}
              disabled={!kelasToDelete || rows.length === 0}
              className="bg-red-700 text-white hover:bg-red-800 disabled:bg-red-900/40 xl:shrink-0"
            >
              <Trash2 size={16} />
              Hapus Kelas
            </Button>
          </div>
        </div>

        <div className="max-h-[640px] overflow-auto p-5">
          {filteredRows.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 text-center text-sm text-muted-foreground">
              <Database className="mb-3 text-emerald-600" size={38} />
              <p className="font-medium text-foreground">
                {loading
                  ? 'Mengambil data praktikan...'
                  : rows.length === 0
                    ? 'Belum ada data praktikan.'
                    : 'Tidak ada data yang cocok.'}
              </p>
              <p className="mt-1">Data akan tampil di sini setelah filter cocok.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Mata Kuliah</TableHead>
                  <TableHead>Kode Asprak</TableHead>
                  <TableHead className="w-28">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.nama}</TableCell>
                    <TableCell>{row.kelas}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.mata_kuliah}</Badge>
                    </TableCell>
                    <TableCell>{row.kode_asprak || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(row)}>
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                          onClick={() => setPersonToDelete(row)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus semua data kelas?</DialogTitle>
            <DialogDescription>
              Tindakan ini akan menghapus semua data praktikan dengan kelas{' '}
              <span className="font-semibold text-foreground">{kelasToDelete || '-'}</span>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
              }}
            >
              Tidak
            </Button>
            <Button variant="destructive" onClick={handleDeleteByKelas} disabled={deleting}>
              <Trash2 size={16} />
              {deleting ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!personToDelete} onOpenChange={(open) => !open && setPersonToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus data praktikan?</DialogTitle>
            <DialogDescription>
              Tindakan ini akan menghapus data{' '}
              <span className="font-semibold text-foreground">{personToDelete?.nama || '-'}</span>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPersonToDelete(null)}>
              Tidak
            </Button>
            <Button variant="destructive" onClick={handleDeletePerson} disabled={deletingPerson}>
              <Trash2 size={16} />
              {deletingPerson ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingRow} onOpenChange={(open) => !open && setEditingRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Data Praktikan</DialogTitle>
            <DialogDescription>
              Perbarui nama, kelas, mata kuliah, atau kode asprak.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nama</label>
              <Input
                value={editForm.nama}
                onChange={(event) => setEditForm((prev) => ({ ...prev, nama: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Kelas</label>
              <Input
                value={editForm.kelas}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, kelas: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Mata Kuliah</label>
              <Input
                value={editForm.mata_kuliah}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, mata_kuliah: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Kode Asprak</label>
              <Input
                value={editForm.kode_asprak}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, kode_asprak: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRow(null)}>
              Batal
            </Button>
            <Button onClick={handleUpdatePraktikan} disabled={updating}>
              <Pencil size={16} />
              {updating ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
