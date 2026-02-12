'use client';

import { useState, useEffect } from 'react';
import { Jadwal, MataKuliah } from '@/types/database';
import { CreateJadwalInput, UpdateJadwalInput } from '@/services/jadwalService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Loader2 } from 'lucide-react';

interface JadwalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateJadwalInput | UpdateJadwalInput) => Promise<any>;
  initialData?: Jadwal | null;
  mataKuliahList: MataKuliah[];
  isLoading?: boolean;
}

const DAYS = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
const ROOMS = [
  'TULT 0604',
  'TULT 0605',
  'TULT 0617',
  'TULT 0618',
  'TULT 0704',
  'TULT 0705',
  'TULT 0712',
  'TULT 0713',
];

export function JadwalModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mataKuliahList,
  isLoading = false,
}: JadwalModalProps) {
  const isEdit = !!initialData;
  const [formData, setFormData] = useState<Partial<CreateJadwalInput>>({
    id_mk: '',
    kelas: '',
    hari: 'SENIN',
    sesi: 1,
    jam: '06:30', // Default start time for session 1
    ruangan: '',
    total_asprak: 1,
    dosen: '',
  });

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
            id_mk: initialData.id_mk.toString(),
            kelas: initialData.kelas,
            hari: initialData.hari,
            sesi: initialData.sesi,
            jam: initialData.jam,
            ruangan: initialData.ruangan || '',
            total_asprak: initialData.total_asprak,
            dosen: initialData.dosen || '',
        });
      } else {
        setFormData({
            id_mk: '',
            kelas: '',
            hari: 'SENIN',
            sesi: 1,
            jam: '06:30',
            ruangan: '',
            total_asprak: 1,
            dosen: '',
        });
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (field: keyof CreateJadwalInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id_mk || !formData.kelas || !formData.hari || !formData.sesi || !formData.jam) {
      alert('Please fill in all required fields');
      return;
    }

    const input = {
      ...formData,
      sesi: Number(formData.sesi),
      total_asprak: Number(formData.total_asprak),
    };

    if (isEdit && initialData) {
      await onSubmit({ ...input, id: initialData.id } as UpdateJadwalInput);
    } else {
      await onSubmit(input as CreateJadwalInput);
    }
    onClose();
  };

  const getFilteredMataKuliah = () => {
      // Logic to filter MK if needed, e.g. show only relevant ones, but for now show all
      return mataKuliahList;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Jadwal' : 'Tambah Jadwal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Mata Kuliah */}
            <div className="space-y-2">
              <Label htmlFor="id_mk">Mata Kuliah</Label>
              <Select
                value={formData.id_mk?.toString()}
                onValueChange={(val) => handleChange('id_mk', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Mata Kuliah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                     {mataKuliahList.map((mk) => (
                        <SelectItem key={mk.id} value={mk.id.toString()}>
                            {mk.nama_lengkap} ({mk.program_studi}) - {mk.praktikum?.tahun_ajaran || 'N/A'}
                        </SelectItem>
                     ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Kelas & Ruangan */}
             <div className="grid grid-cols-2 gap-4 w-full">
                <div className="space-y-2 w-full">
                    <Label htmlFor="kelas">Kelas</Label>
                    <Input
                        id="kelas"
                        value={formData.kelas}
                        onChange={(e) => handleChange('kelas', e.target.value)}
                        placeholder="e.g. IF-45-01"
                        required
                    />
                </div>
                 <div className="space-y-2 w-full">
                    <Label htmlFor="ruangan">Ruangan</Label>
                    <Select
                        value={formData.ruangan}
                        onValueChange={(val) => handleChange('ruangan', val)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Ruangan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {ROOMS.map((room) => (
                                    <SelectItem key={room} value={room}>{room}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
             </div>

            {/* Hari & Sesi */}
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="hari">Hari</Label>
                    <Select
                        value={formData.hari}
                        onValueChange={(val) => handleChange('hari', val)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Hari" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {DAYS.map((day) => (
                                    <SelectItem key={day} value={day}>{day}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="sesi">Sesi</Label>
                    <Select
                        value={formData.sesi?.toString()}
                        onValueChange={(val) => handleChange('sesi', parseInt(val))}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Sesi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {[1, 2, 3, 4].map((s) => (
                                    <SelectItem key={s} value={s.toString()}>Sesi {s}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
             </div>
             
             {/* Jam */}
             <div className="space-y-2">
                <Label htmlFor="jam">Jam Mulai</Label>
                <Input
                    id="jam"
                    type="time"
                    value={formData.jam ? formData.jam.substring(0, 5) : ''}
                    onChange={(e) => handleChange('jam', e.target.value)}
                    required
                />
             </div>

             {/* Dosen */}
             <div className="space-y-2">
                <Label htmlFor="dosen">Kode Dosen</Label>
                <Input
                    id="dosen"
                    value={formData.dosen}
                    onChange={(e) => handleChange('dosen', e.target.value)}
                    placeholder="Kode Dosen"
                />
             </div>

             {/* Total Asprak */}
              <div className="space-y-2">
                <Label htmlFor="total_asprak">Kebutuhan Asprak</Label>
                <Input
                    id="total_asprak"
                    type="number"
                    min={1}
                    value={formData.total_asprak}
                    onChange={(e) => handleChange('total_asprak', parseInt(e.target.value))}
                    required
                />
             </div>

          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Simpan Perubahan' : 'Tambah Jadwal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
