'use client';

import { useState, useEffect } from 'react';
import { Jadwal, MataKuliah } from '@/types/database';
import { CreateJadwalInput, UpdateJadwalInput } from '@/services/jadwalService';
import { DAYS, ROOMS, STATIC_SESSIONS } from '@/constants';
import { toast } from "sonner";
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
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface JadwalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateJadwalInput | UpdateJadwalInput) => Promise<any>;
  initialData?: Jadwal | null;
  mataKuliahList: MataKuliah[];
  isLoading?: boolean;
  selectedModul?: string;
}

export function JadwalModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mataKuliahList,
  isLoading = false,
  selectedModul = 'Default',
}: JadwalModalProps) {

  const isEdit = !!initialData;
  const isSubstitute = selectedModul !== 'Default';
  // If substitute mode, always editable (because we are creating an override)
  // If default mode, follow the existing logic (create=editable, edit=readonly initially)
  const [isDetailsEditable, setIsDetailsEditable] = useState(isSubstitute ? true : !isEdit);
  
  const [formData, setFormData] = useState<Partial<CreateJadwalInput> & { tanggal?: string }>({
    id_mk: '',
    kelas: '',
    hari: 'SENIN',
    sesi: 1,
    jam: '06:30', // Default start time for session 1
    ruangan: '',
    total_asprak: 1,
    dosen: '',
    tanggal: '',
  });

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setIsDetailsEditable(selectedModul !== 'Default' ? true : false); // If substitute, editable by default
        setFormData({
            id_mk: initialData.id_mk.toString(),
            kelas: initialData.kelas,
            hari: initialData.hari,
            sesi: initialData.sesi,
            jam: initialData.jam,
            ruangan: initialData.ruangan || '',
            total_asprak: initialData.total_asprak,
            dosen: initialData.dosen || '',
            tanggal: initialData.tanggal || '', 
        });
      } else {
        // Default to Senin Sesi 1
        const defaultDay = 'SENIN';
        const defaultSession = STATIC_SESSIONS[defaultDay][0];
        setIsDetailsEditable(true); // Default to editable for create
        setFormData({
            id_mk: '',
            kelas: '',
            hari: defaultDay,
            sesi: defaultSession.sesi,
            jam: defaultSession.jam,
            ruangan: '',
            total_asprak: 1,
            dosen: '',
            tanggal: '',
        });
      }
    }
  }, [isOpen, initialData, selectedModul]);

  const handleChange = (field: keyof CreateJadwalInput, value: any) => {
    setFormData((prev) => {
        const newData = { ...prev, [field]: value };
        
        // Auto-update jam when hari or sesi changes
        if (field === 'hari' || field === 'sesi') {
            const currentDay = field === 'hari' ? value : newData.hari;
            // If day changed, reset session to first available session of that day
            let currentSessionId = field === 'hari' ? STATIC_SESSIONS[currentDay][0].sesi : (field === 'sesi' ? value : newData.sesi);

            // Ensure session exists for the day (e.g., if switching from Senin to Jumat, Sesi 2 might not exist/be valid if we strictly follow the array, but here we just need to find the session object)
            // Actually, better logic: find the session object.
            const daySessions = STATIC_SESSIONS[currentDay];
            let sessionObj = daySessions.find(s => s.sesi === currentSessionId);
            
            // If not found (e.g. switching day and old session ID doesn't exist in new day), default to first session of new day
            if (!sessionObj) {
                sessionObj = daySessions[0];
                currentSessionId = sessionObj.sesi;
                newData.sesi = currentSessionId;
            }

            newData.jam = sessionObj.jam;
        }

        return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id_mk || !formData.kelas || !formData.hari || !formData.sesi || !formData.jam) {
      toast.error('Mohon isi semua field yang wajib');
      return;
    }

    if (selectedModul !== 'Default' && !formData.tanggal) {
        toast.error('Tanggal wajib diisi untuk jadwal pengganti');
        return;
    }

    const baseInput = {
      ...formData,
      sesi: Number(formData.sesi),
      total_asprak: Number(formData.total_asprak),
    };

    const input: any = { ...baseInput };

    if (selectedModul !== 'Default') {
        input.modul = parseInt(selectedModul.replace('Modul ', ''));
        input.id_jadwal = initialData?.id;
    } else if (isEdit) {
        input.id = initialData?.id;
    }
    
    await onSubmit(input);
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
          <DialogTitle>
              {selectedModul !== 'Default' 
                ? `Edit Jadwal Pengganti (${selectedModul})` 
                : (isEdit ? 'Edit Jadwal' : 'Tambah Jadwal')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          
          {isEdit && selectedModul === 'Default' && (
            <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded-lg border border-border/50">
              <Switch
                id="edit-mode"
                checked={isDetailsEditable}
                onCheckedChange={setIsDetailsEditable}
              />
              <Label htmlFor="edit-mode" className="cursor-pointer">Edit Detail Jadwal (Mata Kuliah, Kelas, dll)</Label>
            </div>
          )}

          {selectedModul !== 'Default' && (
              <div className="space-y-2">
                <Label htmlFor="tanggal">Tanggal Pengganti</Label>
                <Input
                    id="tanggal"
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                    required
                />
              </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {/* Mata Kuliah */}
            <div className="space-y-2">
              <Label htmlFor="id_mk">Mata Kuliah</Label>
              <Select
                value={formData.id_mk?.toString()}
                onValueChange={(val) => handleChange('id_mk', val)}
                disabled={selectedModul !== 'Default' ? true : !isDetailsEditable} 
              >
                <SelectTrigger className="w-full disabled:opacity-70 disabled:cursor-not-allowed">
                  <SelectValue placeholder="Pilih Mata Kuliah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                     {mataKuliahList.map((mk) => (
                        <SelectItem key={mk.id} value={mk.id.toString()}>
                            {mk.nama_lengkap} ({mk.program_studi})
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
                        disabled={selectedModul !== 'Default' ? true : !isDetailsEditable}
                        className="disabled:opacity-70 disabled:cursor-not-allowed"
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
                                {(STATIC_SESSIONS[formData.hari || 'SENIN'] || []).map((s) => (
                                    <SelectItem key={s.sesi} value={s.sesi.toString()}>Sesi {s.sesi} ({s.jam})</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
             </div>
             
             {/* Dosen */}
             <div className="space-y-2">
                <Label htmlFor="dosen">Kode Dosen</Label>
                <Input
                    id="dosen"
                    value={formData.dosen}
                    onChange={(e) => handleChange('dosen', e.target.value)}
                    placeholder="Kode Dosen"
                    disabled={!isDetailsEditable}
                    className="disabled:opacity-70 disabled:cursor-not-allowed"
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
                    disabled={!isDetailsEditable}
                    className="disabled:opacity-70 disabled:cursor-not-allowed"
                />
             </div>

          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedModul !== 'Default' ? 'Simpan Jadwal Pengganti' : (isEdit ? 'Simpan Perubahan' : 'Tambah Jadwal')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
