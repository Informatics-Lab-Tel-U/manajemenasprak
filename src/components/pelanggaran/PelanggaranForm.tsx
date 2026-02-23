import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

import { Asprak, Jadwal } from '@/types/database';
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
  'Lainnya'
];

const MODUL_OPTIONS = [
  'Modul 1',
  'Modul 2',
  'Modul 3',
  'Modul 4',
  'Modul 5',
  'Modul 6',
  'Modul 7',
  'Modul 8',
  'Modul 9',
  'Modul 10',
  'Modul 11',
  'Modul 12',
  'Modul 13',
  'Modul 14',
  'Modul 15',
  'Modul 16',
];

export default function PelanggaranForm({
  onSubmit,
  onCancel,
  isLoading = false
}: PelanggaranFormProps) {
  const [asprakList, setAsprakList] = useState<Asprak[]>([]);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [idAsprak, setIdAsprak] = useState('');
  const [idJadwal, setIdJadwal] = useState('');
  const [jenis, setJenis] = useState('');
  const [modul, setModul] = useState('');
  const [keterangan, setKeterangan] = useState('');

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      try {
        const [asprakRes, jadwalRes] = await Promise.all([
          fetchAllAsprak(),
          fetchJadwal()
        ]);

        if (asprakRes.ok && asprakRes.data) {
          setAsprakList(asprakRes.data);
        }

        if (jadwalRes.ok && jadwalRes.data) {
          setJadwalList(jadwalRes.data);
        }
      } catch (error) {
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
      id_jadwal: parseInt(idJadwal),
      jenis,
      ...(modul && { modul }),
      ...(keterangan && { keterangan })
    };

    await onSubmit(formData);
  };

  // Get asprak name for display
  const getAsprakName = (asprakId: string) => {
    const asprak = asprakList.find(a => a.id === asprakId);
    return asprak ? `${asprak.nama_lengkap} (${asprak.kode})` : '';
  };

  // Get jadwal info for display
  const getJadwalInfo = (jadwalId: string) => {
    const jadwal = jadwalList.find(j => j.id === parseInt(jadwalId));
    if (!jadwal) return '';

    const mkName = jadwal.mata_kuliah?.nama_lengkap || 'Unknown MK';
    return `${mkName} - ${jadwal.hari}, ${jadwal.jam} (Kelas ${jadwal.kelas})`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {/* Asprak Selection */}
        <div className="space-y-1.5">
          <Label htmlFor="asprak">Asprak *</Label>
          <Select
            value={idAsprak}
            onValueChange={setIdAsprak}
            disabled={loadingData}
          >
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

        {/* Jadwal Selection */}
        <div className="space-y-1.5">
          <Label htmlFor="jadwal">Jadwal *</Label>
          <Select
            value={idJadwal}
            onValueChange={setIdJadwal}
            disabled={loadingData}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Pilih Jadwal" />
            </SelectTrigger>
            <SelectContent>
              {jadwalList.map((jadwal) => {
                const mkName = jadwal.mata_kuliah?.nama_lengkap || 'Unknown MK';
                return (
                  <SelectItem key={jadwal.id} value={jadwal.id.toString()}>
                    {mkName} - {jadwal.hari}, {jadwal.jam} (Kelas {jadwal.kelas})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Jenis Pelanggaran */}
        <div className="space-y-1.5">
          <Label htmlFor="jenis">Jenis Pelanggaran *</Label>
          <Select
            value={jenis}
            onValueChange={setJenis}
          >
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

        {/* Modul - value="" di Root menampilkan placeholder; SelectItem tidak boleh value="" */}
        <div className="space-y-1.5">
          <Label htmlFor="modul">Modul</Label>
          <Select
            value={modul === '' ? '' : modul}
            onValueChange={setModul}
            disabled={loadingData}
          >
            <SelectTrigger className="h-9 w-full" id="modul">
              <SelectValue placeholder="Pilih Modul (opsional)" />
            </SelectTrigger>
            <SelectContent>
              {MODUL_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Keterangan */}
        <div className="space-y-1.5">
          <Label htmlFor="keterangan">Keterangan</Label>
          <Input
            id="keterangan"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Detail tambahan tentang pelanggaran..."
            className="w-full"
          />
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
          Cancel
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