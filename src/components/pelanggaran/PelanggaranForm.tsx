'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Asprak, Jadwal } from '@/types/database';
import { fetchAllAsprak } from '@/lib/fetchers/asprakFetcher';
import { fetchJadwal } from '@/lib/fetchers/jadwalFetcher';

interface PelanggaranFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const VIOLATION_TYPES = [
  'Terlambat',
  'Tidak Hadir',
  'Tidak Siap Mengajar',
  'Berperilaku Tidak Pantas',
  'Lainnya',
];

export default function PelanggaranForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: PelanggaranFormProps) {
  const [asprakList, setAsprakList] = useState<Asprak[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [idAsprak, setIdAsprak] = useState('');
  const [idJadwal, setIdJadwal] = useState('');
  const [jenis, setJenis] = useState('');
  const [modul, setModul] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      try {
        const [asprakRes, jadwalRes] = await Promise.all([
          fetchAllAsprak(),
          fetchJadwal(),
        ]);
        if (asprakRes.ok && asprakRes.data) setAsprakList(asprakRes.data);
        if (jadwalRes.ok && jadwalRes.data) setJadwalList(jadwalRes.data);
      } catch {
        toast.error('Gagal memuat data awal');
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idAsprak || !idJadwal || !jenis) {
      toast.error('Mohon lengkapi semua field yang wajib');
      return;
    }

    const formData = {
      id_asprak: idAsprak,
      id_jadwal: idJadwal,
      jenis,
      ...(modul !== null && { modul }),
    };

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {/* Asprak */}
        <div className="space-y-1.5">
          <Label htmlFor="asprak">Asprak *</Label>
          <Select value={idAsprak} onValueChange={setIdAsprak} disabled={loadingData}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Pilih Asprak" />
            </SelectTrigger>
            <SelectContent>
              {asprakList.map((asprak) => (
                <SelectItem key={asprak.id} value={asprak.id}>
                  {asprak.nama_lengkap} ({asprak.kode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Jadwal */}
        <div className="space-y-1.5">
          <Label htmlFor="jadwal">Jadwal *</Label>
          <Select value={idJadwal} onValueChange={setIdJadwal} disabled={loadingData}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Pilih Jadwal" />
            </SelectTrigger>
            <SelectContent>
              {jadwalList.map((jadwal) => {
                const mkName = jadwal.mata_kuliah?.nama_lengkap ?? 'Unknown MK';
                return (
                  <SelectItem key={jadwal.id} value={jadwal.id}>
                    {mkName} — {jadwal.hari}, {jadwal.jam} (Kelas {jadwal.kelas})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Jenis Pelanggaran */}
        <div className="space-y-1.5">
          <Label htmlFor="jenis">Jenis Pelanggaran *</Label>
          <Select value={jenis} onValueChange={setJenis}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Pilih Jenis Pelanggaran" />
            </SelectTrigger>
            <SelectContent>
              {VIOLATION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Modul */}
        <div className="space-y-1.5">
          <Label htmlFor="modul">Modul</Label>
          <Select
            value={modul !== null ? String(modul) : ''}
            onValueChange={(v) => setModul(parseInt(v))}
            disabled={loadingData}
          >
            <SelectTrigger className="h-9 w-full" id="modul">
              <SelectValue placeholder="Pilih Modul (opsional)" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 16 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  Modul {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="h-8"
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          size="sm"
          className="h-8"
          disabled={isLoading || loadingData}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Catat Pelanggaran
        </Button>
      </div>
    </form>
  );
}