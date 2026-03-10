'use client';

import * as React from 'react';
import { Filter, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { fetchPelanggaranSummary } from '@/lib/fetchers/pelanggaranFetcher';
import type { PelanggaranSummaryEntry } from '@/services/pelanggaranService';
import type { Role } from '@/config/rbac';
import { toast } from 'sonner';

interface Props {
  initialTahunAjaranList: string[];
  userRole: Role;
}

export default function PelanggaranRekapClient({ initialTahunAjaranList, userRole }: Props) {
  const [tahunAjaran, setTahunAjaran] = React.useState(initialTahunAjaranList[0] || '');
  const [modul, setModul] = React.useState<string>('all');
  const [minCount, setMinCount] = React.useState<number>(1);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<PelanggaranSummaryEntry[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (initialTahunAjaranList[0]) {
      handleFetch(initialTahunAjaranList[0], 'all', 1);
    }
  }, []);

  async function handleFetch(t: string, m: string, c: number) {
    setLoading(true);
    try {
      const modulVal = m === 'all' ? undefined : Number(m);
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

  if (!mounted) return null;

  return (
    <div className="container space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Pelanggaran Asprak</h1>
          <p className="text-muted-foreground mt-1">
            Agregasi data pelanggaran asisten praktikum lintas praktikum
          </p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card glass p-6 border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Filter Parameter</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tahun Ajaran</label>
            <Select value={tahunAjaran} onValueChange={setTahunAjaran}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Pilih Tahun" />
              </SelectTrigger>
              <SelectContent>
                {initialTahunAjaranList.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Modul</label>
            <Select value={modul} onValueChange={setModul}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Semua Modul" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Modul</SelectItem>
                {Array.from({ length: 14 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    Modul {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Min. Pelanggaran</label>
            <Input
              type="number"
              min={1}
              value={minCount}
              onChange={(e) => setMinCount(Number(e.target.value))}
              className="h-9"
            />
          </div>

          <Button onClick={loadData} disabled={loading} className="h-9">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Tampilkan
          </Button>
        </div>
      </div>

      {/* Results Table */}
      {(() => {
        // Flatten all violations from matched asprak entries
        const flatViolations = data.flatMap((entry) =>
          (entry.violations || []).map((v) => ({
            ...v,
            _kode_asprak: entry.kode_asprak,
            _nama_asprak: entry.nama_asprak,
          }))
        );

        return (
          <div className="card glass border border-border/50 overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-border/50 bg-muted/20">
              <h3 className="font-semibold text-sm">Daftar Pelanggaran</h3>
              <Badge variant="secondary">{flatViolations.length} records</Badge>
            </div>
            <div className="p-6">
              <div className="rounded-md border overflow-hidden">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[20%]">MK</TableHead>
                      <TableHead className="w-[18%]">Kode Asprak</TableHead>
                      <TableHead className="w-[14%] text-center">Kelas</TableHead>
                      <TableHead className="w-[20%]">Jenis</TableHead>
                      <TableHead className="w-[14%] text-center">Modul</TableHead>
                      <TableHead className="w-[14%] text-center">Jam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span className="text-sm">Memuat data...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : flatViolations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-1">
                            <p className="text-sm">Tidak ada data pelanggaran yang ditemukan.</p>
                            <p className="text-xs opacity-60">
                              Coba sesuaikan filter pencarian Anda
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      flatViolations.map((v) => (
                        <TableRow key={v.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="text-sm truncate">
                            <div className="font-medium truncate">
                              {v.jadwal?.mata_kuliah?.praktikum?.nama ?? '—'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs font-semibold">
                              {v._kode_asprak}
                            </span>
                            <div className="text-xs text-muted-foreground truncate">
                              {v._nama_asprak}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {v.jadwal?.kelas ?? '—'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-xs font-normal whitespace-nowrap"
                            >
                              {v.jenis}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm">{v.modul ?? '—'}</TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {v.jadwal?.jam ?? '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
