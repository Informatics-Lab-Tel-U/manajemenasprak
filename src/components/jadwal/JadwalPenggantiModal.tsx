'use client';

import { useState, useEffect, useMemo } from 'react';
import { Jadwal, MataKuliah } from '@/types/database';
import { DAYS, STATIC_SESSIONS, ROOMS } from '@/constants';
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

import { fetchModulSchedule } from '@/lib/fetchers/modulScheduleFetcher';

interface JadwalPenggantiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: any) => Promise<any>;
  initialData?: any | null; 
  mataKuliahList: MataKuliah[];
  allJadwal: Jadwal[];
  isLoading?: boolean;
  currentTerm?: string;
  disableModul?: boolean;
}

export function JadwalPenggantiModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mataKuliahList,
  allJadwal,
  isLoading = false,
  currentTerm,
  disableModul = false,
}: JadwalPenggantiModalProps) {
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedMKId, setSelectedMKId] = useState('');
  const [selectedJadwalId, setSelectedJadwalId] = useState('');
  const [modul, setModul] = useState<number>(1);
  const [tanggal, setTanggal] = useState('');
  const [hari, setHari] = useState('SENIN');
  const [sesi, setSesi] = useState<number>(1);
  const [jam, setJam] = useState('06:30');
  const [ruangan, setRuangan] = useState('');

  // PJJ Support
  const isPJJ = useMemo(() => {
    const mk = mataKuliahList.find((m) => m.id === selectedMKId);
    const j = allJadwal.find((jad) => jad.id === selectedJadwalId);

    const mkMatch =
      mk?.nama_lengkap.toLowerCase().includes('pjj') ||
      mk?.program_studi.toLowerCase().includes('pjj');
    const classMatch = j?.kelas.toLowerCase().includes('pjj');

    return !!(mkMatch || classMatch);
  }, [selectedMKId, selectedJadwalId, mataKuliahList, allJadwal]);

  const pjjTimes = useMemo(() => {
    const times = [];
    let current = 6 * 60 + 30; // 06:30
    const end = 21 * 60 + 30; // 21:30

    while (current <= end) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      current += 60; // 60 min intervals (hourly)
    }
    return times;
  }, []);

  const calculateSesiFromJamPJJ = (timeStr: string, day: string) => {
    const session = STATIC_SESSIONS[day]?.find((s) => s.jam === timeStr);
    return session ? session.sesi : 0;
  };
  
  const [modulSchedules, setModulSchedules] = useState<any[]>([]);

  // Pre-load data if editing or set defaults if adding
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const j = initialData.jadwal;
        const mk = j?.mata_kuliah;
        
        setSelectedTerm(mk?.praktikum?.tahun_ajaran || '');
        setSelectedMKId(j?.id_mk || '');
        setSelectedJadwalId(initialData.id_jadwal || '');
        setModul(initialData.modul);
        setTanggal(initialData.tanggal);
        setHari(initialData.hari);
        setSesi(initialData.sesi);
        setJam(initialData.jam);
        setRuangan(initialData.ruangan);
      } else {
        setSelectedTerm(currentTerm || '');
        setModul(1);
        setTanggal('');
        setHari('SENIN');
        setSesi(1);
        setJam('06:30');
        setRuangan('');
      }
    }
  }, [isOpen, initialData, currentTerm]);

  // Fetch TMM when selectedTerm changes
  useEffect(() => {
    if (isOpen && selectedTerm) {
      const fetchTMM = async () => {
        const result = await fetchModulSchedule(selectedTerm);
        if (result.ok && result.data) {
          setModulSchedules(result.data);
        }
      };
      fetchTMM();
    }
  }, [isOpen, selectedTerm]);

  const calculateDate = (m: number, h: string, schedules: any[]) => {
    const schedule = schedules.find((s) => s.modul === m);
    if (!schedule?.tanggal_mulai) return '';

    const dayOrder = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'];
    const targetDayIndex = dayOrder.indexOf(h.toUpperCase());
    
    if (targetDayIndex === -1) return schedule.tanggal_mulai;

    try {
      const d = new Date(schedule.tanggal_mulai);
      d.setDate(d.getDate() + targetDayIndex);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  // Sync date when Modul, Hari, or modulSchedules changes
  useEffect(() => {
    if (isOpen && modulSchedules.length > 0) {
      const newTanggal = calculateDate(modul, hari, modulSchedules);
      if (newTanggal) {
        setTanggal(newTanggal);
      }
    }
  }, [isOpen, modul, hari, modulSchedules]);

  const availableTerms = useMemo(() => {
    return Array.from(new Set(mataKuliahList.map(mk => mk.praktikum?.tahun_ajaran).filter(Boolean))) as string[];
  }, [mataKuliahList]);

  const filteredMKList = useMemo(() => {
    if (!selectedTerm) return [];
    return mataKuliahList.filter(mk => mk.praktikum?.tahun_ajaran === selectedTerm);
  }, [selectedTerm, mataKuliahList]);

  const filteredJadwalList = useMemo(() => {
    if (!selectedMKId) return [];
    return allJadwal.filter(j => j.id_mk === selectedMKId);
  }, [selectedMKId, allJadwal]);

  const selectedJadwal = useMemo(() => {
    return allJadwal.find(j => j.id === selectedJadwalId);
  }, [selectedJadwalId, allJadwal]);

  const handleSesiChange = (val: string) => {
    const sInt = parseInt(val);
    setSesi(sInt);
    const sessionObj = STATIC_SESSIONS[hari]?.find(s => s.sesi === sInt);
    if (sessionObj) setJam(sessionObj.jam);
  };

  const handleHariChange = (val: string) => {
    setHari(val);
    if (isPJJ) {
      // Recalculate sessions from current jam if PJJ
      setSesi(calculateSesiFromJamPJJ(jam, val));
    } else {
      const sessionObj = STATIC_SESSIONS[val]?.find((s) => s.sesi === sesi);
      if (sessionObj) setJam(sessionObj.jam);
    }
  };

  const handleJamChange = (val: string) => {
    setJam(val);
    if (isPJJ) {
      const calculatedSesi = calculateSesiFromJamPJJ(val, hari);
      setSesi(calculatedSesi);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJadwalId || !modul || !tanggal || !hari || (sesi === undefined || sesi === null) || !jam || !ruangan) {
      toast.error('Mohon lengkapi semua field');
      return;
    }

    const input = {
      id_jadwal: selectedJadwalId,
      modul,
      tanggal,
      hari,
      sesi,
      jam,
      ruangan,
    };

    const success = await onSubmit(input);
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[min(800px,90vh)] flex-col gap-0 p-0 sm:max-w-[500px]">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4">{initialData ? 'Edit' : 'Tambah'} Jadwal Pengganti</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex max-h-full flex-col overflow-hidden">
          <form onSubmit={handleFormSubmit} className="space-y-4 px-6 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Tahun Ajaran</Label>
                <Select value={selectedTerm} onValueChange={(v) => {
                  setSelectedTerm(v);
                  setSelectedMKId('');
                  setSelectedJadwalId('');
                }} disabled={!!initialData}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Tahun Ajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTerms.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mata Kuliah</Label>
                <Select value={selectedMKId} onValueChange={(v) => {
                  setSelectedMKId(v);
                  setSelectedJadwalId('');
                }} disabled={!selectedTerm || !!initialData}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Mata Kuliah" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMKList.map(mk => (
                      <SelectItem key={mk.id} value={mk.id}>
                        {mk.nama_lengkap} - {mk.program_studi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select value={selectedJadwalId} onValueChange={setSelectedJadwalId} disabled={!selectedMKId || !!initialData}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredJadwalList.map(j => (
                      <SelectItem key={j.id} value={j.id}>{j.kelas}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedJadwal && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex gap-3 text-sm text-primary dark:text-primary">
                  <Info size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wider mb-1">Jadwal Asli</p>
                    <p className="font-medium">{selectedJadwal.hari}, {selectedJadwal.jam} (Sesi {selectedJadwal.sesi || '-'})</p>
                    <p className="text-xs opacity-80">{selectedJadwal.ruangan || 'Tanpa Ruangan'}</p>
                  </div>
                </div>
              )}

              <div className="h-px bg-border/50 my-2" />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Modul</Label>
                  <Select 
                    value={modul.toString()} 
                    onValueChange={(v) => setModul(parseInt(v))}
                    disabled={disableModul}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 15 }, (_, i) => i + 1).map(m => (
                        <SelectItem key={m} value={m.toString()}>Modul {m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Pengganti</Label>
                  <Input 
                    type="date" 
                    value={tanggal} 
                    onChange={(e) => setTanggal(e.target.value)} 
                    required 
                    readOnly
                    className="w-full bg-muted cursor-not-allowed" 
                  />
                  <p className="text-[10px] text-muted-foreground italic">Ditentukan otomatis berdasarkan Modul & Hari</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hari Pengganti</Label>
                  <Select value={hari} onValueChange={handleHariChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isPJJ ? 'Jam Pengganti' : 'Sesi Pengganti'}</Label>
                  {isPJJ ? (
                    <Select value={jam} onValueChange={handleJamChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {pjjTimes.map((t) => {
                          const calculatedSesi = calculateSesiFromJamPJJ(t, hari);
                          return (
                            <SelectItem key={t} value={t}>
                              {t} {calculatedSesi > 0 ? `(Sesi ${calculatedSesi})` : ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select value={sesi.toString()} onValueChange={handleSesiChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATIC_SESSIONS[hari]?.map((s) => (
                          <SelectItem key={s.sesi} value={s.sesi.toString()}>
                            Sesi {s.sesi} ({s.jam})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ruangan Pengganti</Label>
                <Select value={ruangan} onValueChange={setRuangan}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Ruangan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tanpa Ruangan">Tanpa Ruangan (Online)</SelectItem>
                    {ROOMS.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t mt-6">
              <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? 'Simpan Perubahan' : 'Tambah Jadwal Pengganti'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
