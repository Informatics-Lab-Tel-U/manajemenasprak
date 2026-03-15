'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTahunAjaran } from '@/hooks/useTahunAjaran';
import {
  fetchModulSchedule,
  saveModulSchedule,
  type ModulScheduleEntryDto,
} from '@/lib/fetchers/modulScheduleFetcher';
import { toast } from 'sonner';

export default function JadwalModulClientPage() {
  const { tahunAjaranList, loading: loadingTahunAjaran } = useTahunAjaran();
  const [term, setTerm] = useState<string>('');
  const [rows, setRows] = useState<ModulScheduleEntryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [startModul, setStartModul] = useState<string>('1');

  useEffect(() => {
    if (tahunAjaranList.length > 0 && !term) {
      setTerm(tahunAjaranList[0]);
    }
  }, [tahunAjaranList, term]);

  const loadRows = useCallback(
    async (t: string) => {
      if (!t) return;
      setLoading(true);
      try {
        const res = await fetchModulSchedule(t);
        if (res.ok && res.data) {
          setRows(res.data);
        } else {
          setRows(
            Array.from({ length: 15 }, (_, idx) => ({
              modul: idx + 1,
              tanggal_mulai: null,
            }))
          );
          if (res.error) toast.error(res.error);
        }
      } catch (err: any) {
        toast.error(err.message || 'Gagal memuat tanggal modul');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (term) {
      loadRows(term);
    }
  }, [term, loadRows]);

  const handleChangeDate = (modul: number, tanggal: string) => {
    setRows((prev) =>
      prev.map((row) => (row.modul === modul ? { ...row, tanggal_mulai: tanggal || null } : row))
    );
  };

  const addDays = (dateStr: string, days: number): string => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDayName = (dateStr: string | null): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(d);
    } catch {
      return '';
    }
  };

  const isMonday = (dateStr: string | null): boolean => {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    return d.getDay() === 1;
  };

  const isSequentiallyValid = (modul: number, dateStr: string | null): { valid: boolean; error?: string } => {
    if (!dateStr) return { valid: true };
    
    // Find previous module with a date
    const prevRowsWithDate = rows.filter(r => r.modul < modul && r.tanggal_mulai);
    if (prevRowsWithDate.length > 0) {
      const lastPrev = prevRowsWithDate[prevRowsWithDate.length - 1];
      if (lastPrev.tanggal_mulai && dateStr < lastPrev.tanggal_mulai) {
        return { valid: false, error: `Sebelum M${lastPrev.modul}` };
      }
    }

    if (!isMonday(dateStr)) {
      return { valid: false, error: 'Bukan Senin' };
    }

    return { valid: true };
  };

  const hasInvalidDates = rows.some((row) => {
    const { valid } = isSequentiallyValid(row.modul, row.tanggal_mulai);
    return !valid;
  });

  const handleGenerate = () => {
    const startM = parseInt(startModul, 10);
    const byModul = new Map(rows.map((r) => [r.modul, r.tanggal_mulai]));
    const anchor = byModul.get(startM);

    if (!anchor) {
      toast.error(`Isi tanggal pada Modul ${startM} terlebih dahulu sebagai acuan.`);
      return;
    }

    const { valid, error } = isSequentiallyValid(startM, anchor);
    if (!valid) {
      toast.error(`Tanggal Modul ${startM} tidak valid: ${error}.`);
      return;
    }

    let lastDate = anchor;
    for (let m = startM + 1; m <= 15; m += 1) {
      lastDate = addDays(lastDate, 7);
      byModul.set(m, lastDate);
    }

    setRows(
      rows.map((row) => ({
        modul: row.modul,
        tanggal_mulai: byModul.get(row.modul) ?? row.tanggal_mulai,
      }))
    );
    setIsGenerateDialogOpen(false);
    toast.success(`Berhasil generate tanggal dari Modul ${startM}`);
  };

  const handleSave = async () => {
    if (!term) {
      toast.error('Pilih tahun ajaran terlebih dahulu');
      return;
    }
    if (hasInvalidDates) {
      toast.error('Gagal menyimpan: Ada urutan tanggal yang tidak valid atau bukan hari Senin');
      return;
    }

    setLoading(true);
    try {
      const res = await saveModulSchedule(term, rows);
      if (res.ok) {
        toast.success('Tanggal mulai modul berhasil disimpan');
      } else {
        toast.error(res.error || 'Gagal menyimpan tanggal modul');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan tanggal modul');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container space-y-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tanggal Mulai Praktikum per Modul</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Atur tanggal mulai praktikum untuk setiap modul (1-15) per tahun ajaran.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={term}
            onValueChange={setTerm}
            disabled={loading || loadingTahunAjaran || tahunAjaranList.length === 0}
          >
            <SelectTrigger className="w-56 h-9">
              <SelectValue
                placeholder={loadingTahunAjaran ? 'Memuat...' : 'Pilih Tahun Ajaran'}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {tahunAjaranList.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </header>

      <section className="space-y-4">
        <div className="rounded-lg border border-border/60 overflow-hidden bg-background">
          <div className="divide-y divide-border/50 max-h-[500px] overflow-auto">
            {rows.map((row) => {
              const dayName = getDayName(row.tanggal_mulai);
              const { valid, error } = isSequentiallyValid(row.modul, row.tanggal_mulai);

              return (
                <div
                  key={row.modul}
                  className="grid grid-cols-[120px,1fr] items-center px-6 py-3 text-sm hover:bg-muted/30 transition-colors"
                >
                  <div className="font-semibold text-foreground">Modul {row.modul}</div>
                  <div className="flex items-center gap-4">
                    <Input
                      type="date"
                      className={`h-9 max-w-[200px] ${
                        !valid ? 'border-destructive text-destructive focus-visible:ring-destructive' : ''
                      }`}
                      value={row.tanggal_mulai ?? ''}
                      onChange={(e) => handleChangeDate(row.modul, e.target.value)}
                      disabled={loading || !term}
                    />
                    {row.tanggal_mulai && (
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-sm ${
                          valid ? 'bg-emerald-50 text-emerald-700' : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {dayName}
                        {!valid && ` (${error})`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={loading || !term || rows.length === 0}
              >
                <Wand2 className="h-4 w-4" />
                Generate Otomatis
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[360px] p-0 overflow-hidden border-none shadow-2xl">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle className="text-xl font-bold">Generate Otomatis</DialogTitle>
              </DialogHeader>
              <div className="px-6 py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startModul" className="text-sm font-medium">Mulai dari Modul</Label>
                  <Select value={startModul} onValueChange={setStartModul}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Pilih Modul" />
                    </SelectTrigger>
                    <SelectContent>
                      {rows.map((r) => (
                        <SelectItem key={r.modul} value={r.modul.toString()}>
                          Modul {r.modul}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] leading-relaxed text-muted-foreground bg-muted/50 p-3 rounded-md border border-border/40">
                    Sistem akan mengisi modul-modul berikutnya dengan interval <strong>7 hari</strong> sekali dimulai dari modul yang dipilih.
                  </p>
                </div>
              </div>
              <DialogFooter className="p-6 pt-2 flex-row gap-2 sm:justify-end bg-muted/20">
                <Button variant="ghost" size="sm" onClick={() => setIsGenerateDialogOpen(false)} className="flex-1 sm:flex-none">
                  Batal
                </Button>
                <Button size="sm" onClick={handleGenerate} className="flex-1 sm:flex-none px-6">
                  Generate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            size="sm" 
            className="px-6" 
            onClick={handleSave} 
            disabled={loading || !term || hasInvalidDates}
          >
            Simpan Perubahan
          </Button>
        </div>
      </section>
    </div>
  );
}

