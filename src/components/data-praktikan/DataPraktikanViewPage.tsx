'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { loadPraktikanRows, savePraktikanRows, type PraktikanRow } from './storage';

export default function DataPraktikanViewPage() {
  const [rows, setRows] = useState<PraktikanRow[]>([]);
  const [query, setQuery] = useState('');
  const [kelasToDelete, setKelasToDelete] = useState('');

  useEffect(() => {
    setRows(loadPraktikanRows());
  }, []);

  const kelasOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.kelas).filter(Boolean))).sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rows;

    return rows.filter((row) =>
      [row.nama, row.kelas, row.kode_asprak].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [query, rows]);

  const stats = useMemo(() => {
    const uniqueAsprak = new Set(rows.map((row) => row.kode_asprak).filter(Boolean)).size;
    const uniqueKelas = new Set(rows.map((row) => row.kelas).filter(Boolean)).size;
    return { total: rows.length, uniqueAsprak, uniqueKelas };
  }, [rows]);

  const persistRows = (nextRows: PraktikanRow[]) => {
    setRows(nextRows);
    savePraktikanRows(nextRows);
  };

  const handleDeletePerson = (id: string) => {
    persistRows(rows.filter((row) => row.id !== id));
    toast.success('Data praktikan dihapus.');
  };

  const handleDeleteByKelas = () => {
    if (!kelasToDelete) {
      toast.error('Pilih kelas terlebih dahulu.');
      return;
    }

    const removed = rows.filter((row) => row.kelas === kelasToDelete).length;
    persistRows(rows.filter((row) => row.kelas !== kelasToDelete));
    setKelasToDelete('');
    toast.success(`${removed} data dari kelas ${kelasToDelete} dihapus.`);
  };

  return (
    <div className="container space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lihat Data Praktikan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola data praktikan lokal sebelum database/API disambungkan.
          </p>
        </div>
        <Button asChild>
          <Link href="/data-praktikan/input">
            <Plus size={16} />
            Input Data
          </Link>
        </Button>
      </header>

      <section className="grid gap-2 text-right sm:grid-cols-3">
        <div className="rounded-md border px-3 py-2">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-md border px-3 py-2">
          <p className="text-xs text-muted-foreground">Kelas</p>
          <p className="text-lg font-semibold">{stats.uniqueKelas}</p>
        </div>
        <div className="rounded-md border px-3 py-2">
          <p className="text-xs text-muted-foreground">Asprak</p>
          <p className="text-lg font-semibold">{stats.uniqueAsprak}</p>
        </div>
      </section>

      <section className="rounded-lg border bg-background">
        <div className="grid gap-3 border-b p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, kelas, atau kode asprak"
          />
          <select
            value={kelasToDelete}
            onChange={(event) => setKelasToDelete(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">Pilih kelas untuk bulk delete</option>
            {kelasOptions.map((kelas) => (
              <option key={kelas} value={kelas}>
                {kelas}
              </option>
            ))}
          </select>
          <Button
            variant="destructive"
            onClick={handleDeleteByKelas}
            disabled={!kelasToDelete || rows.length === 0}
          >
            <Trash2 size={16} />
            Hapus Kelas
          </Button>
        </div>

        <div className="max-h-[640px] overflow-auto p-4">
          {filteredRows.length === 0 ? (
            <div className="flex min-h-56 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
              {rows.length === 0 ? 'Belum ada data praktikan.' : 'Tidak ada data yang cocok.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Kode Asprak</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead className="w-16">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.nama}</TableCell>
                    <TableCell>{row.kelas}</TableCell>
                    <TableCell>{row.kode_asprak}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePerson(row.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </div>
  );
}
