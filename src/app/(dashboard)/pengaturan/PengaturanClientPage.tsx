'use client';

import { useState, useCallback, useEffect } from 'react';
import { Trash2, Upload, FileSpreadsheet, Download, ShieldAlert, Activity } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as importFetcher from '@/lib/fetchers/importFetcher';
import * as jadwalFetcher from '@/lib/fetchers/jadwalFetcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { Role } from '@/config/rbac';
import { toast } from 'sonner';

import StepPraktikum from '@/components/pengaturan/excel-steps/StepPraktikum';
import StepMataKuliah from '@/components/pengaturan/excel-steps/StepMataKuliah';
import StepAsprak from '@/components/pengaturan/excel-steps/StepAsprak';
import StepPlotting from '@/components/pengaturan/excel-steps/StepPlotting';
import StepJadwal from '@/components/pengaturan/excel-steps/StepJadwal';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useTahunAjaran } from '@/hooks/useTahunAjaran';

interface DatabaseClientPageProps {
  initialIsMaintenance: boolean;
  initialUserRole: Role | null;
}

export default function DatabaseClientPage({
  initialIsMaintenance,
  initialUserRole,
}: DatabaseClientPageProps) {
  const [termYear, setTermYear] = useState('24');
  const [termSem, setTermSem] = useState<'1' | '2'>('2');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [progress, setProgress] = useState(0);

  const { tahunAjaranList, loading: loadingTahunAjaran } = useTahunAjaran();
  const [exportTerm, setExportTerm] = useState('');
  const [deleteTerm, setDeleteTerm] = useState('');

  // Maintenance Mode States
  const [isMaintenance, setIsMaintenance] = useState(initialIsMaintenance);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [userRole] = useState<Role | null>(initialUserRole);

  // Wizard States
  const [wizardStep, setWizardStep] = useState<number>(0);
  const [excelData, setExcelData] = useState<{
    praktikum: any[];
    mataKuliah: any[];
    asprak: any[];
    plotting: any[];
    jadwal: any[];
  } | null>(null);
  const [activeTerm, setActiveTerm] = useState<string>('');

  useEffect(() => {
    if (tahunAjaranList.length > 0) {
      if (!exportTerm) setExportTerm(tahunAjaranList[0]);
      if (!deleteTerm) setDeleteTerm(tahunAjaranList[0]);
    }
  }, [tahunAjaranList, exportTerm, deleteTerm]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteTermModalOpen, setIsDeleteTermModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [confirmTermInput, setConfirmTermInput] = useState('');
  const CONFIRMATION_PHRASE = 'HAPUS SEMUA';
  const CONFIRMATION_TERM_PHRASE = 'HAPUS JADWAL';

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const startY = parseInt(termYear);
      const term = `${startY}${startY + 1}-${termSem}`;

      setLoading(true);
      setProgress(0);
      setStatus({ type: 'info', message: `Memproses ${file.name}...` });

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.floor(Math.random() * 10) + 5;
        });
      }, 500);

      try {
        const ab = await file.arrayBuffer();
        const XLSX = await import('xlsx');
        const wb = XLSX.read(ab);

        const getSheetData = (name: string) => {
          const sheet = wb.Sheets[name] || wb.Sheets[name.replace('_', ' ')] || null;
          if (!sheet) return [];
          return XLSX.utils.sheet_to_json(sheet);
        };

        const data = {
          praktikum: getSheetData('praktikum'),
          mataKuliah: getSheetData('mata_kuliah'),
          asprak: getSheetData('asprak'),
          jadwal: getSheetData('jadwal'),
          plotting: getSheetData('asprak_praktikum'),
        };

        setExcelData(data);
        setActiveTerm(term);

        clearInterval(interval);
        setProgress(100);
        setStatus(null);
        setWizardStep(1);
      } catch (e: any) {
        clearInterval(interval);
        setProgress(100);
        setStatus({ type: 'error', message: e.message || 'Gagal membaca file Excel' });
      } finally {
        setLoading(false);
        setTimeout(() => setProgress(0), 1000);
      }
    },
    [termYear, termSem]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
  });

  const handleClearTrigger = () => {
    setIsDeleteModalOpen(true);
    setConfirmInput('');
  };

  const handleExecuteClear = async () => {
    if (confirmInput !== CONFIRMATION_PHRASE) return;

    setIsDeleteModalOpen(false);
    setLoading(true);
    setStatus({ type: 'info', message: 'Membersihkan database...' });

    try {
      const res = await fetch('/api/clear', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus({ type: 'success', message: 'Database berhasil dibersihkan!' });
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJadwalTermTrigger = () => {
    if (!deleteTerm) return;
    setIsDeleteTermModalOpen(true);
    setConfirmTermInput('');
  };

  const handleExecuteDeleteJadwalTerm = async () => {
    if (confirmTermInput !== CONFIRMATION_TERM_PHRASE) return;

    setIsDeleteTermModalOpen(false);
    setLoading(true);
    setStatus({ type: 'info', message: `Menghapus jadwal angkatan ${deleteTerm}...` });

    try {
      const result = await jadwalFetcher.deleteJadwalByTerm(deleteTerm);
      if (result.ok) {
        setStatus({
          type: 'success',
          message: `Berhasil menghapus jadwal angkatan ${deleteTerm}!`,
        });
      } else {
        setStatus({ type: 'error', message: result.error || 'Gagal menghapus jadwal' });
      }
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || 'Gagal menghapus jadwal' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!exportTerm) {
      setStatus({ type: 'error', message: 'Silakan pilih tahun ajaran yang akan diexport' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: `Mengekspor data untuk angkatan: ${exportTerm}...` });

    try {
      const result = await importFetcher.exportExcelDataset(exportTerm);
      if (result.ok && result.data) {
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();

        const wsPraktikum = XLSX.utils.json_to_sheet(result.data.praktikum);
        XLSX.utils.book_append_sheet(wb, wsPraktikum, 'praktikum');

        const wsMk = XLSX.utils.json_to_sheet(result.data.mata_kuliah);
        XLSX.utils.book_append_sheet(wb, wsMk, 'mata_kuliah');

        const wsAsprak = XLSX.utils.json_to_sheet(result.data.asprak);
        XLSX.utils.book_append_sheet(wb, wsAsprak, 'asprak');

        const wsJadwal = XLSX.utils.json_to_sheet(result.data.jadwal);
        XLSX.utils.book_append_sheet(wb, wsJadwal, 'jadwal');

        const wsPivot = XLSX.utils.json_to_sheet(result.data.asprak_praktikum);
        XLSX.utils.book_append_sheet(wb, wsPivot, 'asprak_praktikum');

        XLSX.writeFile(wb, `EXPORT_${exportTerm}.xlsx`);
        setStatus({ type: 'success', message: `Berhasil mengekspor data untuk ${exportTerm}!` });
      } else {
        setStatus({ type: 'error', message: result.error || 'Ekspor gagal' });
      }
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || 'Ekspor gagal' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const startY = parseInt(termYear);
    const termStr = `${startY}${startY + 1}-${termSem}`;

    const praktikumRows = [
      { nama_singkat: 'PBO', tahun_ajaran: termStr },
      { nama_singkat: 'ALPRO', tahun_ajaran: termStr },
      { nama_singkat: 'JARKOM', tahun_ajaran: termStr },
    ];
    const wsPraktikum = XLSX.utils.json_to_sheet(praktikumRows);
    XLSX.utils.book_append_sheet(wb, wsPraktikum, 'praktikum');

    const mkRows = [
      {
        mk_singkat: 'PBO',
        program_studi: 'IF',
        nama_lengkap: 'Pemrograman Berorientasi Objek',
        dosen_koor: 'ABC',
      },
      {
        mk_singkat: 'ALPRO',
        program_studi: 'SE',
        nama_lengkap: 'Algoritma Pemrograman',
        dosen_koor: 'DEF',
      },
      {
        mk_singkat: 'JARKOM',
        program_studi: 'IF',
        nama_lengkap: 'Jaringan Komputer',
        dosen_koor: 'GHI',
      },
    ];
    const wsMk = XLSX.utils.json_to_sheet(mkRows);
    XLSX.utils.book_append_sheet(wb, wsMk, 'mata_kuliah');

    const asprakRows = [
      { nim: '1201210001', nama_lengkap: 'Budi Santoso', kode: 'BDS', angkatan: '21' },
      { nim: '1201210002', nama_lengkap: 'Siti Aminah', kode: 'SIT', angkatan: '21' },
      { nim: '1201210003', nama_lengkap: 'Ahmad Dani', kode: 'ADM', angkatan: '21' },
    ];
    const wsAsprak = XLSX.utils.json_to_sheet(asprakRows);
    XLSX.utils.book_append_sheet(wb, wsAsprak, 'asprak');

    const jadwalRows = [
      {
        kelas: 'IF-45-01',
        nama_singkat: 'PBO',
        hari: 'SENIN',
        sesi: 1,
        jam: '06:30',
        ruangan: 'TULT 0612',
        total_asprak: 2,
        dosen: 'ABC',
      },
      {
        kelas: 'SE-45-02',
        nama_singkat: 'ALPRO',
        hari: 'SELASA',
        sesi: 2,
        jam: '08:30',
        ruangan: 'GKU 0201',
        total_asprak: 3,
        dosen: 'DEF',
      },
      {
        kelas: 'IF-45-03',
        nama_singkat: 'JARKOM',
        hari: 'RABU',
        sesi: 3,
        jam: '10:30',
        ruangan: 'TULT 0505',
        total_asprak: 2,
        dosen: 'GHI',
      },
    ];
    const wsJadwal = XLSX.utils.json_to_sheet(jadwalRows);
    XLSX.utils.book_append_sheet(wb, wsJadwal, 'jadwal');

    const pivotRows = [
      { kode_asprak: 'BDS', mk_singkat: 'PBO' },
      { kode_asprak: 'SIT', mk_singkat: 'ALPRO' },
      { kode_asprak: 'ADM', mk_singkat: 'JARKOM' },
    ];
    const wsPivot = XLSX.utils.json_to_sheet(pivotRows);
    XLSX.utils.book_append_sheet(wb, wsPivot, 'asprak_praktikum');

    XLSX.writeFile(wb, `${termStr}_TEMPLATE.xlsx`);
  };

  const handleToggleMaintenance = async (checked: boolean) => {
    setLoadingMaintenance(true);
    try {
      const res = await fetch('/api/system/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: checked }),
      });
      const data = await res.json();
      if (data.ok) {
        setIsMaintenance(checked);
        toast.success(checked ? 'Maintenance Mode Diaktifkan' : 'Maintenance Mode Dimatikan');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah status maintenance');
    } finally {
      setLoadingMaintenance(false);
    }
  };

  return (
    <div className="container mx-auto">
      {/* Page Header */}
      <header className="mb-10 pb-8 border-b border-border/50">
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola impor, ekspor, dan pembersihan data sistem.
        </p>
      </header>

      {/* Global Status */}
      {status && (
        <div
          className={cn(
            'mb-8 px-4 py-3 rounded-md text-sm border-l-2 bg-muted/30',
            status.type === 'error' && 'border-destructive text-destructive',
            status.type === 'success' && 'border-green-500 text-green-600 dark:text-green-400',
            status.type === 'info' && 'border-blue-500 text-blue-600 dark:text-blue-400'
          )}
        >
          {status.message}
        </div>
      )}

      {/* Section: Import Excel Dataset */}
      <section className="pb-10 mb-10 border-b border-border/40">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Import Excel Dataset</h2>
            {wizardStep > 0 && (
              <Badge variant="secondary" className="text-xs">
                Langkah {wizardStep}/5
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground ml-6">
            Upload file .xlsx untuk mengimpor data ke dalam sistem.
          </p>
        </div>

        {wizardStep === 0 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm">Tahun Ajaran</Label>
              <div className="flex items-center gap-2">
                <Input
                  required
                  type="number"
                  min="10"
                  max="99"
                  placeholder="YY"
                  value={termYear}
                  onChange={(e) => setTermYear(e.target.value)}
                  className="w-20 text-center"
                />
                <span className="text-muted-foreground">/</span>
                <div className="w-20 px-3 py-2 bg-muted/40 rounded-md text-muted-foreground text-center text-sm">
                  {termYear ? parseInt(termYear) + 1 : 'YY'}
                </div>
                <span className="text-muted-foreground">-</span>
                <Select value={termSem} onValueChange={(val) => setTermSem(val as '1' | '2')}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="1">1 (Ganjil)</SelectItem>
                      <SelectItem value="2">2 (Genap)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Isi ini untuk otomatis mengisi tahun ajaran jika di Excel kosong.
              </p>
            </div>

            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all',
                isDragActive
                  ? 'border-foreground bg-muted/20'
                  : 'border-border bg-transparent hover:border-foreground/40 hover:bg-muted/10'
              )}
            >
              <input {...getInputProps()} />
              <FileSpreadsheet size={40} className="text-muted-foreground mb-4 mx-auto" />
              {isDragActive ? (
                <p className="font-semibold text-sm">Letakkan file Excel di sini...</p>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium text-sm">Tarik & letakkan dataset .xlsx di sini</p>
                  <p className="text-sm text-muted-foreground">atau klik untuk memilih file</p>
                  <p className="text-xs text-muted-foreground mt-3 opacity-60">
                    Sheet: praktikum, mata_kuliah, asprak, jadwal, asprak_praktikum
                  </p>
                </div>
              )}
              {loading && (
                <div className="mt-4 space-y-2">
                  <Progress value={progress} className="h-1 w-full" />
                  <p className="text-xs text-muted-foreground">
                    {progress}% Mengunggah & Memproses...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {wizardStep === 1 && excelData && (
          <div>
            <div className="mb-4">
              <h3 className="font-semibold text-lg">Langkah 1: Praktikum</h3>
              <p className="text-sm text-muted-foreground">Tinjau dan simpan data Praktikum</p>
            </div>
            <StepPraktikum
              data={excelData.praktikum}
              onNext={() => setWizardStep(2)}
              onPrev={() => setWizardStep(0)}
              onImport={async (rows) => {
                await fetch('/api/praktikum', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'bulk-import', rows }),
                }).then((res) => {
                  if (!res.ok) throw new Error('Gagal import praktikum');
                });
              }}
            />
          </div>
        )}

        {wizardStep === 2 && excelData && (
          <div>
            <div className="mb-4">
              <h3 className="font-semibold text-lg">Langkah 2: Mata Kuliah</h3>
              <p className="text-sm text-muted-foreground">
                Tinjau dan simpan data Mata Kuliah ({activeTerm})
              </p>
            </div>
            <StepMataKuliah
              data={excelData.mataKuliah}
              term={activeTerm}
              onNext={() => setWizardStep(3)}
              onPrev={() => setWizardStep(1)}
              onImport={async (rows, t) => {
                await fetch(`/api/mata-kuliah`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'bulk', data: rows, term: t }),
                }).then((res) => {
                  if (!res.ok) throw new Error('Gagal import MK');
                });
              }}
            />
          </div>
        )}

        {wizardStep === 3 && excelData && (
          <div>
            <div className="mb-4">
              <h3 className="font-semibold text-lg">Langkah 3: Asisten Praktikum</h3>
              <p className="text-sm text-muted-foreground">Tinjau dan simpan data Asprak</p>
            </div>
            <StepAsprak
              data={excelData.asprak}
              term={activeTerm}
              onNext={() => setWizardStep(4)}
              onPrev={() => setWizardStep(2)}
              onImport={async (rows, t) => {
                const res = await fetch('/api/asprak', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'bulk-import', rows: rows }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Gagal import Asprak');
              }}
            />
          </div>
        )}

        {wizardStep === 4 && excelData && (
          <div>
            <div className="mb-4">
              <h3 className="font-semibold text-lg">Langkah 4: Penugasan (Plotting)</h3>
              <p className="text-sm text-muted-foreground">
                Tinjau dan simpan Plotting Asprak ({activeTerm})
              </p>
            </div>
            <StepPlotting
              data={excelData.plotting}
              term={activeTerm}
              onNext={() => setWizardStep(5)}
              onPrev={() => setWizardStep(3)}
              onSuccess={() => {}}
            />
          </div>
        )}

        {wizardStep === 5 && excelData && (
          <div>
            <div className="mb-4">
              <h3 className="font-semibold text-lg">Langkah 5: Jadwal</h3>
              <p className="text-sm text-muted-foreground">
                Tinjau dan simpan data Jadwal ({activeTerm})
              </p>
            </div>
            <StepJadwal
              data={excelData.jadwal}
              term={activeTerm}
              onPrev={() => setWizardStep(4)}
              onNext={() => {
                setWizardStep(0);
                setExcelData(null);
                setStatus({ type: 'success', message: 'Import Excel selesai dengan sukses!' });
              }}
              onImport={async (rows) => {
                const res = await jadwalFetcher.bulkImportJadwal(rows);
                if (!res.ok) throw new Error(res.error || 'Gagal import jadwal');
              }}
            />
          </div>
        )}
      </section>

      {/* Section: Export & Template */}
      <section className="pb-10 mb-10 border-b border-border/40">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Download className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Export & Template</h2>
          </div>
          <p className="text-sm text-muted-foreground ml-6">
            Download dataset aktif atau template kosong untuk diisi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Export */}
          <div className="space-y-3 p-5 rounded-lg border border-border/60 bg-muted/10">
            <div>
              <p className="text-sm font-medium">Export Dataset</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Download semua data dari database
              </p>
            </div>
            <Select
              value={exportTerm}
              onValueChange={setExportTerm}
              disabled={loading || loadingTahunAjaran}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue
                  placeholder={loadingTahunAjaran ? 'Memuat...' : 'Pilih Tahun Ajaran'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {tahunAjaranList.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                  {tahunAjaranList.length === 0 && !loadingTahunAjaran && (
                    <SelectItem value="none" disabled>
                      Tidak ada data di database
                    </SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              disabled={loading || !exportTerm}
              className="w-full h-9 gap-2"
              size="sm"
            >
              <FileSpreadsheet size={14} />
              Export .xlsx
            </Button>
          </div>

          {/* Template */}
          <div className="space-y-3 p-5 rounded-lg border border-border/60 bg-muted/10">
            <div>
              <p className="text-sm font-medium">Download Template</p>
              <p className="text-xs text-muted-foreground mt-0.5">Template kosong siap diisi</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                required
                type="number"
                min="10"
                max="99"
                placeholder="YY"
                value={termYear}
                onChange={(e) => setTermYear(e.target.value)}
                className="w-20 text-center h-9"
              />
              <span className="text-muted-foreground text-sm">/</span>
              <div className="w-20 px-3 py-2 bg-muted/40 rounded-md text-muted-foreground text-center text-sm">
                {termYear ? parseInt(termYear) + 1 : 'YY'}
              </div>
              <Select value={termSem} onValueChange={(val) => setTermSem(val as '1' | '2')}>
                <SelectTrigger className="flex-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="1">1 (Ganjil)</SelectItem>
                    <SelectItem value="2">2 (Genap)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="w-full h-9 gap-2"
              size="sm"
            >
              <Download size={14} />
              Download Template
            </Button>
          </div>
        </div>
      </section>

      {/* Section: System Control — ADMIN ONLY */}
      {userRole === 'ADMIN' && (
        <>
          <section className="pb-10 mb-10 border-b border-border/40">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-base font-semibold">System Control</h2>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Kelola status sistem dan akses pengguna.
              </p>
            </div>

            {/* Maintenance Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/60 bg-muted/10">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Maintenance Mode</p>
                  {isMaintenance && (
                    <Badge variant="destructive" className="animate-pulse text-[10px] px-1.5 py-0">
                      ACTIVE
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Kunci akses publik dan redirect user non-admin ke halaman pemeliharaan.
                </p>
              </div>
              <Switch
                checked={isMaintenance}
                onCheckedChange={handleToggleMaintenance}
                disabled={loadingMaintenance}
              />
            </div>
          </section>

          {/* Danger Zone */}
          <section className="pb-10">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                <h2 className="text-base font-semibold text-destructive">Danger Zone</h2>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
              </p>
            </div>

            <div className="rounded-lg border border-destructive/30 divide-y divide-destructive/20">
              {/* Delete Jadwal by Term */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Hapus Jadwal per Tahun Ajaran</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Menghapus jadwal untuk term tertentu, tidak menghapus Mata Kuliah dan Praktikum.
                  </p>
                  <div className="pt-2">
                    <Select
                      value={deleteTerm}
                      onValueChange={setDeleteTerm}
                      disabled={loading || loadingTahunAjaran}
                    >
                      <SelectTrigger className="h-8 w-48 text-xs">
                        <SelectValue
                          placeholder={loadingTahunAjaran ? 'Memuat...' : 'Pilih Tahun Ajaran'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {tahunAjaranList.map((term) => (
                            <SelectItem key={term} value={term}>
                              {term}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteJadwalTermTrigger}
                  disabled={loading || !deleteTerm}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Jadwal {deleteTerm || ''}
                </Button>
              </div>

              {/* Clear Entire Database */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Clear Entire Database</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Menghapus SEMUA data dari semua tabel (kecuali data login).
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearTrigger}
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset Database
                </Button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Delete Confirmation Modal (Full Clear) */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apakah Anda benar-benar yakin?</DialogTitle>
            <DialogDescription>
              Tindakan ini akan menghapus seluruh data praktikum, mata kuliah, asprak, dan jadwal
              secara permanen.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Ketik "{CONFIRMATION_PHRASE}" untuk mengonfirmasi:</Label>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={CONFIRMATION_PHRASE}
              className="border-destructive focus-visible:ring-destructive"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleExecuteClear}
              disabled={confirmInput !== CONFIRMATION_PHRASE}
            >
              Hapus Semua Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Terminal Modal (Delete Term) */}
      <Dialog open={isDeleteTermModalOpen} onOpenChange={setIsDeleteTermModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Jadwal Angkatan {deleteTerm}?</DialogTitle>
            <DialogDescription>
              Semua jadwal praktikum untuk angkatan {deleteTerm} akan dihapus selamanya.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Ketik "{CONFIRMATION_TERM_PHRASE}" untuk mengonfirmasi:</Label>
            <Input
              value={confirmTermInput}
              onChange={(e) => setConfirmTermInput(e.target.value)}
              placeholder={CONFIRMATION_TERM_PHRASE}
              className="border-destructive focus-visible:ring-destructive"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteTermModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleExecuteDeleteJadwalTerm}
              disabled={confirmTermInput !== CONFIRMATION_TERM_PHRASE}
            >
              Hapus Jadwal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
