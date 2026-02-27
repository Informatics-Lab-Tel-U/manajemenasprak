'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, CheckCircle2, ArrowRight, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import PelanggaranAddModal from '@/components/pelanggaran/PelanggaranAddModal';
import type { Praktikum, Asprak, Jadwal } from '@/types/database';
import { usePelanggaran } from '@/hooks/usePelanggaran';

interface Props {
  initialPraktikumList: Praktikum[];
  initialTahunAjaranList: string[];
  initialCountMap: Record<string, { total: number; allFinal: boolean; finalized: boolean }>;
  initialAsprakList: (Asprak & { praktikum_ids?: string[] })[];
  initialJadwalList: (Jadwal & { id_praktikum?: string })[];
  isKoor: boolean;
  userId?: string;
}

export default function PelanggaranClientPage({
  initialPraktikumList, initialTahunAjaranList, initialCountMap, initialAsprakList, initialJadwalList, isKoor, userId
}: Props) {
  const router = useRouter();
  const {
    praktikumList,
    tahunAjaranList,
    selectedTahun: filterTahun,
    setSelectedTahun: setFilterTahun,
    countMap,
    asprakList,
    jadwalList,
    loading,
    addPelanggaran,
  } = usePelanggaran(initialTahunAjaranList[0], isKoor, userId);

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Use state with initial props as fallback to avoid flicker, or just use hook data
  const displayedPraktikum = praktikumList.length > 0 ? praktikumList : initialPraktikumList;
  const displayedTahunList = tahunAjaranList.length > 0 ? tahunAjaranList : initialTahunAjaranList;
  const displayedCountMap = Object.keys(countMap).length > 0 ? countMap : initialCountMap;
  const displayedAsprak = asprakList.length > 0 ? asprakList : initialAsprakList;
  const displayedJadwal = jadwalList.length > 0 ? jadwalList : initialJadwalList;

  const currentTahun = filterTahun || initialTahunAjaranList[0] || '';

  const filteredPraktikum = React.useMemo(
    () => currentTahun ? displayedPraktikum.filter((p) => p.tahun_ajaran === currentTahun) : displayedPraktikum,
    [displayedPraktikum, currentTahun]
  );

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
      // router.refresh(); // Hook should handle refetch counts if implement properly, but refresh is safe
    } catch (err: any) {
      toast.error(err.message ?? 'Gagal mencatat pelanggaran');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="title-gradient text-3xl font-bold">Pelanggaran</h1>
          <p className="text-muted-foreground mt-1">Log indisipliner asisten praktikum per praktikum</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} size="sm" className="gap-1.5" disabled={loading}>
          <Plus className="h-4 w-4" />
          Catat Pelanggaran
        </Button>
      </div>

      {/* Filter Tahun */}
      <div className="card glass p-4 mb-6 flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Tahun Ajaran:</span>
        <Select value={currentTahun} onValueChange={setFilterTahun} disabled={loading}>
          <SelectTrigger className="h-8 w-[160px] text-sm">
            <SelectValue placeholder="Tahun Ajaran" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {displayedTahunList.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {loading && <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin ml-2" />}
      </div>

      {/* Cards */}
      {filteredPraktikum.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-16">
          {loading ? 'Memuat data...' : 'Tidak ada data praktikum.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPraktikum.map((p) => {
            const info = (displayedCountMap as any)[p.id] ?? { total: 0, allFinal: false, finalized: false };
            return (
              <div key={p.id} className="card glass p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{p.nama}</h3>
                    <p className="text-xs text-muted-foreground">{p.tahun_ajaran}</p>
                  </div>
                  {info.finalized ? (
                    <Badge className="gap-1 shrink-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Terfinalisasi
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0">Aktif</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold">{info.total}</span>
                    <span className="text-xs text-muted-foreground ml-1.5">pelanggaran</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/pelanggaran/${p.id}`)}
                    className="gap-1.5"
                  >
                    Lihat
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <PelanggaranAddModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddViolation}
        isLoading={isSubmitting}
        praktikumList={displayedPraktikum}
        tahunAjaranList={displayedTahunList}
        asprakList={displayedAsprak}
        jadwalList={displayedJadwal}
      />
    </div>
  );
}
