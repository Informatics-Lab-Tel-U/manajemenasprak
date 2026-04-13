'use client';

import { useState, useEffect, useMemo } from 'react';
import { Jadwal, MataKuliah } from '@/types/database';
import { DAYS, STATIC_SESSIONS, ROOMS } from '@/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Spinner } from '@/components/ui/spinner';
import { Info } from 'lucide-react';
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
  const [selectedPraktikum, setSelectedPraktikum] = useState('');
  // selectedMKId is kept in state but resolved automatically from the selected jadwal — not exposed in UI
  const [selectedMKId, setSelectedMKId] = useState('');
  const [selectedJadwalId, setSelectedJadwalId] = useState('');
  const [modul, setModul] = useState<number>(1);
  const [tanggal, setTanggal] = useState('');
  const [hari, setHari] = useState('SENIN');
  const [sesi, setSesi] = useState<number>(1);
  const [jam, setJam] = useState('06:30');
  const [ruangan, setRuangan] = useState('');

  // Detect PJJ from the selected jadwal's kelas suffix
  const isPJJ = useMemo(() => {
    const j = allJadwal.find((jad) => jad.id === selectedJadwalId);
    return !!(j?.kelas?.toLowerCase().includes('pjj'));
  }, [selectedJadwalId, allJadwal]);

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

  // --- Derived lists ---

  // Unique terms from mataKuliahList
  const availableTerms = useMemo(() => {
    return Array.from(
      new Set(mataKuliahList.map((mk) => mk.praktikum?.tahun_ajaran).filter(Boolean))
    ) as string[];
  }, [mataKuliahList]);

  // Unique praktikum names for the selected term (from mataKuliahList)
  const availablePraktikum = useMemo(() => {
    if (!selectedTerm) return [];
    return Array.from(
      new Set(
        mataKuliahList
          .filter((mk) => mk.praktikum?.tahun_ajaran === selectedTerm)
          .map((mk) => mk.praktikum?.nama)
          .filter(Boolean)
      )
    ) as string[];
  }, [selectedTerm, mataKuliahList]);

  // jadwal list filtered by term + praktikum (global kelas list), sorted:
  // IF 01..N → IF INT → IF PJJ → IT → DS → SE
  const filteredJadwalList = useMemo(() => {
    if (!selectedTerm || !selectedPraktikum) return [];

    const filtered = allJadwal.filter(
      (j) =>
        j.mata_kuliah?.praktikum?.tahun_ajaran === selectedTerm &&
        j.mata_kuliah?.praktikum?.nama === selectedPraktikum
    );

    const PREFIX_ORDER = ['IF', 'IT', 'DS', 'SE'];

    const sortKelas = (a: string, b: string): number => {
      const upper = (s: string) => s.toUpperCase();
      const prefix = (s: string) => s.split('-')[0].toUpperCase();

      const prefixRank = (s: string) => {
        const idx = PREFIX_ORDER.indexOf(prefix(s));
        return idx === -1 ? 99 : idx;
      };

      const isPJJ = (s: string) => upper(s).includes('PJJ');
      const isINT = (s: string) => upper(s).includes('INT');

      // 1. Primary sort: prefix group
      const pr = prefixRank(a) - prefixRank(b);
      if (pr !== 0) return pr;

      // 2. PJJ after non-PJJ within same prefix
      const pjjA = isPJJ(a);
      const pjjB = isPJJ(b);
      if (pjjA !== pjjB) return pjjA ? 1 : -1;

      // 3. INT after regular numbers (within same PJJ status)
      const intA = isINT(a);
      const intB = isINT(b);
      if (intA !== intB) return intA ? 1 : -1;

      // 4. Numeric sort on the last segment
      const numericSuffix = (s: string) => {
        const cleaned = s.toUpperCase().replace('PJJ', '').replace(/[-\s]+$/, '');
        const parts = cleaned.split('-');
        const last = parts[parts.length - 1].replace(/\D/g, '');
        const n = parseInt(last, 10);
        return isNaN(n) ? 9999 : n;
      };
      return numericSuffix(a) - numericSuffix(b);
    };

    return [...filtered].sort((a, b) => sortKelas(a.kelas, b.kelas));
  }, [selectedTerm, selectedPraktikum, allJadwal]);

  // The currently selected jadwal object
  const selectedJadwal = useMemo(() => {
    return allJadwal.find((j) => j.id === selectedJadwalId);
  }, [selectedJadwalId, allJadwal]);

  // Auto-resolve MK from selected jadwal
  useEffect(() => {
    if (selectedJadwal) {
      setSelectedMKId(selectedJadwal.id_mk ?? '');
    }
  }, [selectedJadwal]);

  // Pre-load data if editing or set defaults if adding
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const j = initialData.jadwal as Jadwal | undefined;
        const term = j?.mata_kuliah?.praktikum?.tahun_ajaran || '';
        const praktikumNama = j?.mata_kuliah?.praktikum?.nama || '';

        setSelectedTerm(term);
        setSelectedPraktikum(praktikumNama);
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
        setSelectedPraktikum('');
        setSelectedMKId('');
        setSelectedJadwalId('');
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
      // Avoid UTC shift by parsing manually as local date
      const [y, month, day] = schedule.tanggal_mulai.split('-').map(Number);
      const d = new Date(y, month - 1, day);
      d.setDate(d.getDate() + targetDayIndex);

      const resYear = d.getFullYear();
      const resMonth = String(d.getMonth() + 1).padStart(2, '0');
      const resDay = String(d.getDate()).padStart(2, '0');
      return `${resYear}-${resMonth}-${resDay}`;
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

  const handleSesiChange = (val: string) => {
    const sInt = parseInt(val);
    setSesi(sInt);
    const sessionObj = STATIC_SESSIONS[hari]?.find((s) => s.sesi === sInt);
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
    if (
      !selectedJadwalId ||
      !modul ||
      !tanggal ||
      !hari ||
      sesi === undefined ||
      sesi === null ||
      !jam ||
      !ruangan
    ) {
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
          <DialogTitle className="border-b px-6 py-4">
            {initialData ? 'Edit' : 'Tambah'} Jadwal Pengganti
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex max-h-full flex-col overflow-hidden">
          <form onSubmit={handleFormSubmit} className="space-y-4 px-6 py-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Tahun Ajaran */}
              <div className="space-y-2">
                <Label>Tahun Ajaran</Label>
                <Select
                  value={selectedTerm}
                  onValueChange={(v) => {
                    setSelectedTerm(v);
                    setSelectedPraktikum('');
                    setSelectedMKId('');
                    setSelectedJadwalId('');
                  }}
                  disabled={!!initialData}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Tahun Ajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTerms.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Praktikum (menggantikan Mata Kuliah di UI) */}
              <div className="space-y-2">
                <Label>Praktikum</Label>
                <Select
                  value={selectedPraktikum}
                  onValueChange={(v) => {
                    setSelectedPraktikum(v);
                    setSelectedMKId('');
                    setSelectedJadwalId('');
                  }}
                  disabled={!selectedTerm || !!initialData}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Praktikum" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePraktikum.map((prak) => (
                      <SelectItem key={prak} value={prak}>
                        {prak}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mata Kuliah — hidden dari UI, tetap ada di kode untuk referensi */}
              {/* 
              <div className="space-y-2 hidden">
                <Label>Mata Kuliah</Label>
                <Select value={selectedMKId} disabled>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Ditentukan otomatis dari kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {mataKuliahList.filter(mk => mk.praktikum?.tahun_ajaran === selectedTerm).map((mk) => (
                      <SelectItem key={mk.id} value={mk.id}>
                        {mk.nama_lengkap} - {mk.program_studi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              */}

              {/* Kelas — global dropdown berdasarkan term + praktikum */}
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select
                  value={selectedJadwalId}
                  onValueChange={setSelectedJadwalId}
                  disabled={!selectedPraktikum || !!initialData}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredJadwalList.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.kelas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedJadwal && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex gap-3 text-sm text-primary dark:text-primary">
                  <Info size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-xs uppercase tracking-wider mb-1">
                      Jadwal Asli
                    </p>
                    <p className="font-medium">
                      {selectedJadwal.hari}, {selectedJadwal.jam} (Sesi {selectedJadwal.sesi || '-'}
                      )
                    </p>
                    <p className="text-xs opacity-80">
                      {selectedJadwal.ruangan || 'Tanpa Ruangan'}
                    </p>
                    {selectedJadwal.mata_kuliah && (
                      <p className="text-xs opacity-70 mt-0.5">
                        {selectedJadwal.mata_kuliah.nama_lengkap} ({selectedJadwal.mata_kuliah.program_studi})
                      </p>
                    )}
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
                      {Array.from({ length: 16 }, (_, i) => i + 1).map((m) => (
                        <SelectItem key={m} value={m.toString()}>
                          Modul {m}
                        </SelectItem>
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
                  <p className="text-[10px] text-muted-foreground italic">
                    Ditentukan otomatis berdasarkan Modul &amp; Hari
                  </p>
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
                      {DAYS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
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
                    {ROOMS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
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
                {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                {initialData ? 'Simpan Perubahan' : 'Tambah Jadwal Pengganti'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
