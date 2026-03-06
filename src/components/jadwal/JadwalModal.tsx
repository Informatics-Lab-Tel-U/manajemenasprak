'use client';

import { useState, useEffect } from 'react';
import { Jadwal, MataKuliah } from '@/types/database';
import type { CreateJadwalInput, UpdateJadwalInput } from '@/services/jadwalService';
import { DAYS, ROOMS, STATIC_SESSIONS } from '@/constants';
import { toast } from 'sonner';
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
import { Checkbox } from '@/components/ui/checkbox';

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

  const [formData, setFormData] = useState<
    Partial<CreateJadwalInput> & { tanggal?: string; total_asprak?: number | '' }
  >({
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

  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedPraktikum, setSelectedPraktikum] = useState<string>('');
  const [isPJJ, setIsPJJ] = useState<boolean>(false);
  const [isCustomJam, setIsCustomJam] = useState<boolean>(false);

  // Extract unique terms
  const availableTerms = Array.from(
    new Set(mataKuliahList.map((mk) => mk.praktikum?.tahun_ajaran).filter(Boolean))
  ) as string[];

  // Filter available praktikum names based on the selected term
  const availablePraktikum = Array.from(
    new Set(
      mataKuliahList
        .filter((mk) => mk.praktikum?.tahun_ajaran === selectedTerm)
        .map((mk) => mk.praktikum?.nama)
        .filter(Boolean)
    )
  ) as string[];

  // Filter valid Mata Kuliah based on both term and praktikum name
  const filteredMataKuliah = mataKuliahList.filter(
    (mk) => mk.praktikum?.tahun_ajaran === selectedTerm && mk.praktikum?.nama === selectedPraktikum
  );

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // setIsDetailsEditable(selectedModul !== 'Default' ? true : false); // Handled by standard re-evaluation or derived logic if needed, but here it's fine just ignoring, or set via key/effect correctly without causing sync warnings. Actually, we can move this to a separate logic block.
        setFormData({
          id_mk: initialData.id_mk.toString(),
          kelas: initialData.kelas,
          hari: initialData.hari,
          sesi: initialData.sesi,
          jam: initialData.jam,
          ruangan: initialData.ruangan || '',
          total_asprak: initialData.total_asprak,
          dosen: initialData.dosen || '',
          tanggal: (initialData as any).tanggal || '',
        });

        // Identify the associated term and praktikum name to pre-select
        const currentMK = mataKuliahList.find((mk) => mk.id === initialData.id_mk);
        if (currentMK?.praktikum) {
          setSelectedTerm(currentMK.praktikum.tahun_ajaran || '');
          setSelectedPraktikum(currentMK.praktikum.nama || '');
        }

        setIsPJJ(initialData.kelas.toUpperCase().includes('PJJ'));
        setIsCustomJam(!initialData.sesi || initialData.sesi === 0);
      } else {
        // Default to Senin Sesi 1
        const defaultDay = 'SENIN';
        const defaultSession = STATIC_SESSIONS[defaultDay][0];
        // setIsDetailsEditable(true); // Default to editable for create
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
        setSelectedTerm('');
        setSelectedPraktikum('');
        setIsPJJ(false);
        setIsCustomJam(false);
      }
    }
  }, [isOpen, initialData, selectedModul, mataKuliahList]);

  // Handle editability state sync separately without breaking the flow
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setIsDetailsEditable(selectedModul !== 'Default');
      } else {
        setIsDetailsEditable(true);
      }
    }
  }, [isOpen, initialData, selectedModul]);

  const handleChange = (field: keyof CreateJadwalInput, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Auto-update jam when hari or sesi changes and not in custom jam mode
      if ((field === 'hari' || field === 'sesi') && !isCustomJam) {
        const currentDay = field === 'hari' ? value : newData.hari;
        // If day changed, reset session to first available session of that day
        let currentSessionId =
          field === 'hari'
            ? STATIC_SESSIONS[currentDay][0].sesi
            : field === 'sesi'
              ? value
              : newData.sesi;

        // Ensure session exists for the day
        const daySessions = STATIC_SESSIONS[currentDay];
        let sessionObj = daySessions.find((s) => s.sesi === currentSessionId);

        // If not found, default to first session of new day
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
    if (!formData.id_mk || !formData.kelas || !formData.hari || formData.sesi === undefined || formData.sesi === null || !formData.jam) {
      toast.error('Mohon isi semua field yang wajib');
      return;
    }

    if (selectedModul !== 'Default' && !formData.tanggal) {
      toast.error('Tanggal wajib diisi untuk jadwal pengganti');
      return;
    }

    const baseInput = {
      ...formData,
      sesi: formData.sesi ? Number(formData.sesi) : 0,
      total_asprak: Number(formData.total_asprak),
    };

    if (baseInput.ruangan === 'tanpa_ruangan') {
      baseInput.ruangan = '';
    }

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
              : isEdit
                ? 'Edit Jadwal'
                : 'Tambah Jadwal'}
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
              <Label htmlFor="edit-mode" className="cursor-pointer">
                Edit Detail Jadwal (Mata Kuliah, Kelas, dll)
              </Label>
            </div>
          )}

          {selectedModul !== 'Default' && (
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal Pengganti</Label>
              <Input
                id="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={(e) => setFormData((prev) => ({ ...prev, tanggal: e.target.value }))}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {/* 1. Tahun Ajaran */}
            <div className="space-y-2">
              <Label htmlFor="term">Tahun Ajaran</Label>
              <Select
                value={selectedTerm}
                onValueChange={(val) => {
                  setSelectedTerm(val);
                  setSelectedPraktikum('');
                  handleChange('id_mk', '');
                }}
                disabled={selectedModul !== 'Default' ? true : !isDetailsEditable}
              >
                <SelectTrigger className="w-full disabled:opacity-70 disabled:cursor-not-allowed">
                  <SelectValue placeholder="Pilih Tahun Ajaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {availableTerms.map((term) => (
                      <SelectItem key={term} value={term}>
                        {term}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* 2. Praktikum (Shows only if Term selected) */}
            <div className="space-y-2">
              <Label htmlFor="praktikum">Praktikum</Label>
              <Select
                value={selectedPraktikum}
                onValueChange={(val) => {
                  setSelectedPraktikum(val);
                  handleChange('id_mk', '');
                }}
                disabled={
                  !selectedTerm || (selectedModul !== 'Default' ? true : !isDetailsEditable)
                }
              >
                <SelectTrigger className="w-full disabled:opacity-70 disabled:cursor-not-allowed">
                  <SelectValue placeholder="Pilih Praktikum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {availablePraktikum.map((prak) => (
                      <SelectItem key={prak} value={prak}>
                        {prak}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* 3. Mata Kuliah (Shows only if Praktikum selected) */}
            <div className="space-y-2">
              <Label htmlFor="id_mk">Mata Kuliah</Label>
              <Select
                value={formData.id_mk?.toString()}
                onValueChange={(val) => handleChange('id_mk', val)}
                disabled={
                  !selectedPraktikum || (selectedModul !== 'Default' ? true : !isDetailsEditable)
                }
              >
                <SelectTrigger className="w-full disabled:opacity-70 disabled:cursor-not-allowed">
                  <SelectValue placeholder="Pilih Mata Kuliah" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {filteredMataKuliah.map((mk) => (
                      <SelectItem key={mk.id} value={mk.id.toString()}>
                        {mk.nama_lengkap} ({mk.program_studi})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Kelas & Ruangan */}
            <div className="grid grid-cols-2 gap-4 w-full items-start">
              <div className="space-y-2 w-full">
                <Label htmlFor="kelas">Kelas</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="kelas"
                    value={formData.kelas}
                    onChange={(e) => handleChange('kelas', e.target.value)}
                    placeholder="e.g. IF-45-01"
                    required
                    disabled={isPJJ || (selectedModul !== 'Default' ? true : !isDetailsEditable)}
                    className="disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                  <div className="flex items-center space-x-2 shrink-0">
                    <Checkbox
                      id="is_pjj"
                      checked={isPJJ}
                      onCheckedChange={(checked) => {
                        const isChecked = !!checked;
                        setIsPJJ(isChecked);
                        if (isChecked) {
                          if (!formData.kelas?.endsWith('PJJ')) {
                            setFormData((prev) => ({ ...prev, kelas: (prev.kelas || '') + 'PJJ' }));
                          }
                        } else {
                          if (formData.kelas?.endsWith('PJJ')) {
                            setFormData((prev) => ({
                              ...prev,
                              kelas: prev.kelas?.replace(/PJJ$/, ''),
                            }));
                          }
                        }
                      }}
                      disabled={selectedModul !== 'Default' ? true : !isDetailsEditable}
                    />
                    <Label htmlFor="is_pjj">PJJ</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2 w-full">
                <Label htmlFor="ruangan">Ruangan</Label>
                <Select
                  value={formData.ruangan || (isPJJ ? 'tanpa_ruangan' : '')}
                  onValueChange={(val) => handleChange('ruangan', val)}
                  disabled={selectedModul !== 'Default' ? true : !isDetailsEditable}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Ruangan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {isPJJ && (
                        <SelectItem value="tanpa_ruangan">Tanpa Ruangan (Online)</SelectItem>
                      )}
                      {ROOMS.map((room) => (
                        <SelectItem key={room} value={room}>
                          {room}
                        </SelectItem>
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
                <Select value={formData.hari} onValueChange={(val) => handleChange('hari', val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Hari" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="sesi" className="leading-none">Sesi & Jam</Label>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="custom-jam" className="text-[10px] text-muted-foreground font-medium cursor-pointer">Custom Jam</Label>
                    <Switch
                      id="custom-jam"
                      checked={isCustomJam}
                      onCheckedChange={(checked) => {
                        setIsCustomJam(checked);
                        if (checked) {
                          setFormData((prev) => ({ ...prev, sesi: 0 }));
                        } else {
                          const sObj = STATIC_SESSIONS[formData.hari || 'SENIN'][0];
                          setFormData((prev) => ({ ...prev, sesi: sObj.sesi, jam: sObj.jam }));
                        }
                      }}
                      className="scale-75 origin-right"
                    />
                  </div>
                </div>
                
                {!isCustomJam ? (
                  <Select
                    value={formData.sesi?.toString() || '1'}
                    onValueChange={(val) => handleChange('sesi', parseInt(val))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Sesi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {(STATIC_SESSIONS[formData.hari || 'SENIN'] || []).map((s) => (
                          <SelectItem key={s.sesi} value={s.sesi.toString()}>
                            Sesi {s.sesi} ({s.jam})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={formData.jam?.split(':')[0] || '06'}
                    onValueChange={(val) => setFormData((prev) => ({ ...prev, jam: `${val}:30`, sesi: 0 }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Jam" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Array.from({ length: 16 }, (_, i) => i + 6).map((h) => {
                          const hourStr = h.toString().padStart(2, '0');
                          return (
                            <SelectItem key={hourStr} value={hourStr}>
                              {hourStr}:30
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
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
                value={formData.total_asprak ?? ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    handleChange('total_asprak', '');
                  } else {
                    const parsed = parseInt(raw, 10);
                    handleChange('total_asprak', Number.isNaN(parsed) ? '' : parsed);
                  }
                }}
                required
                disabled={!isDetailsEditable}
                className="disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <DialogFooter className="flex items-center sm:justify-between w-full">
            <div className="flex w-full sm:w-auto items-center sm:hidden justify-end space-x-2 mb-2"></div>

            <div className="flex w-full items-center justify-between sm:justify-start">
              <div className="hidden sm:block"></div>

              <div className="flex w-full sm:w-auto justify-end space-x-2">
                <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedModul !== 'Default'
                    ? 'Simpan Jadwal Pengganti'
                    : isEdit
                      ? 'Simpan Perubahan'
                      : 'Tambah Jadwal'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
