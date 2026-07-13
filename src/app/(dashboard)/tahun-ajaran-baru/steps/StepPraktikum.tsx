'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperSeparator,
  StepperTitle,
  StepperDescription,
  StepperNav,
  StepperContent,
  useStepper,
} from '@/components/ui/stepper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, CheckCircle2, FileSpreadsheet, Download, FileText, AlertCircle, Copy, Save, RefreshCw, Loader2 , ArrowLeft} from 'lucide-react';
import { toast } from 'sonner';

import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import PraktikumCSVPreview, { PraktikumPreviewRow } from '@/components/praktikum/PraktikumCSVPreview';
import { validatePraktikumData } from '@/utils/validation/praktikumValidation';
import MataKuliahCSVPreview, { MataKuliahCSVRow } from '@/components/mata-kuliah/MataKuliahCSVPreview';
import { validateMataKuliahData } from '@/utils/validation/mataKuliahValidation';
import { usePraktikum } from '@/hooks/usePraktikum';
import { cn } from '@/lib/utils';
import { 
  useOnboardingStore, 
  useAutosaveStatus
} from '@/store/useOnboardingStore';
import { Field, FieldLabel, FieldContent } from '@/components/ui/field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TermInput from '@/components/asprak/TermInput';
import { buildTermString } from '@/utils/termHelpers';
import { useTermStore } from '@/store/useTermStore';

const steps = [
  { id: 'praktikum', title: 'Data Praktikum', description: 'Buat tahun ajaran', icon: <BookOpen /> },
  { id: 'matkul', title: 'Mata Kuliah', description: 'Tambahkan MK', icon: <BookOpen /> },
  { id: 'jadwal', title: 'Preview & Simpan', description: 'Konfirmasi Data', icon: <Save /> },
  { id: 'selesai', title: 'Selesai', description: 'Setup berhasil', icon: <CheckCircle2 /> },
];


export default function PraktikumStep() {
  const { praktikumNames, bulkImport } = usePraktikum();
  const { draft, setPraktikumList, markStepCompleted, setCurrentStep } = useOnboardingStore();
  const { activeTerm } = useTermStore();

  // Term Detection
  const getNextTerm = () => {
    if (!activeTerm || activeTerm.length < 6) {
      const currentYear = new Date().getFullYear().toString().slice(-2);
      return { year: currentYear, sem: '1' as '1'|'2' };
    }
    const year = activeTerm.substring(0, 2);
    const sem = activeTerm.substring(5, 6);
    if (sem === '1') {
      return { year, sem: '2' as '1'|'2' };
    } else {
      const nextYear = (parseInt(year) + 1).toString();
      return { year: nextYear, sem: '1' as '1'|'2' };
    }
  };
  
  const nextTerm = getNextTerm();
  const draftTA = draft.praktikumList?.[0]?.tahun_ajaran || '';
  const initialYear = draftTA ? draftTA.substring(0, 2) : nextTerm.year;
  const initialSem = draftTA ? (draftTA.endsWith('2') ? '2' : '1') : nextTerm.sem;
  
  const [termYear, setTermYear] = useState(initialYear);
  const [termSem, setTermSem] = useState<'1' | '2'>(initialSem as '1' | '2');

  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Unified State
  const [previewRows, setPreviewRows] = useState<PraktikumPreviewRow[]>(() => {
    return draft.praktikumList?.map(p => ({
      nama: p.nama,
      tahun_ajaran: p.tahun_ajaran,
      status: 'ok' as const,
      selected: true
    })) || [];
  });

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualInputName, setManualInputName] = useState('');
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copySourceTerm, setCopySourceTerm] = useState('');
  const [availableTerms, setAvailableTerms] = useState<string[]>([]);

  useEffect(() => {
    if (isCopyModalOpen && availableTerms.length === 0) {
      fetch('/api/tahun-ajaran')
        .then(res => res.json())
        .then(res => {
          if (res.ok && res.data) {
            setAvailableTerms(res.data);
            if (res.data.length > 0 && !copySourceTerm) {
              setCopySourceTerm(res.data[0]);
            }
          }
        })
        .catch(err => console.error(err));
    }
  }, [isCopyModalOpen, availableTerms.length, copySourceTerm]);
  
  // Handlers for CSV
  const processCSV = useCallback((file: File) => {
    setUploadError(null);
    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        const { data, errors } = results;
        if (errors.length > 0) {
          setUploadError(`CSV parsing error: ${errors[0].message}`);
          return;
        }
        if (data.length === 0) {
          setUploadError('CSV kosong — tidak ada data yang ditemukan.');
          return;
        }
        const preview = validatePraktikumData(data, praktikumNames.map(p => ({ ...p, tahun_ajaran: '' })));
        setPreviewRows(prev => {
          // append and filter duplicate
          const existingNames = new Set(prev.map(r => r.nama.toUpperCase()));
          const newRows = preview.filter(r => !existingNames.has(r.nama.toUpperCase()));
          return [...prev, ...newRows];
        });
      },
      error: (err: Error) => setUploadError(`Failed to parse CSV: ${err.message}`),
    });
  }, [praktikumNames]);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx')) {
      try {
        const XLSX = await import('xlsx');
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
            
            if (jsonData.length === 0) {
              setUploadError('File Excel kosong — tidak ada data yang ditemukan.');
              return;
            }

            const preview = validatePraktikumData(jsonData, praktikumNames.map(p => ({ ...p, tahun_ajaran: '' })));
            setPreviewRows(prev => {
              const existingNames = new Set(prev.map(r => r.nama.toUpperCase()));
              const newRows = preview.filter(r => !existingNames.has(r.nama.toUpperCase()));
              return [...prev, ...newRows];
            });
          } catch (err: any) {
            setUploadError(`Gagal membaca file Excel: ${err.message}`);
          }
        };
        reader.readAsBinaryString(file);
      } catch (err: any) {
        setUploadError(`Library xlsx belum siap. Coba gunakan CSV sementara.`);
      }
    } else {
      processCSV(file);
    }
  }, [processCSV, praktikumNames]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
  });

  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    const data = [
      { nama: 'PBO', tahun_ajaran: '2425-2' },
      { nama: 'JARKOM', tahun_ajaran: '2425-2' },
    ];
    if (format === 'csv') {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_praktikum.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'template_praktikum.xlsx');
    }
  };
  
  const handleToggleSelect = useCallback((rowIndex: number) => {
    setPreviewRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[rowIndex] };
      if (row.status !== 'error' && row.status !== 'skipped') {
        row.selected = !row.selected;
        updated[rowIndex] = row;
      }
      return updated;
    });
  }, []);

  const handleToggleAll = useCallback((checked: boolean) => {
    setPreviewRows((prev) => prev.map((row) => (row.status !== 'error' && row.status !== 'skipped' ? { ...row, selected: checked } : row)));
  }, []);

  // Handlers for Manual Add
  const handleAddManual = (e: React.FormEvent) => {
     e.preventDefault();
     if (!manualInputName) return;
     
     const finalTahunAjaran = buildTermString(termYear, termSem);
     
     if (previewRows.some(r => r.nama.toUpperCase() === manualInputName.toUpperCase())) {
        toast.error('Praktikum sudah ada di daftar');
        return;
     }

     setPreviewRows(prev => [...prev, { nama: manualInputName.toUpperCase(), tahun_ajaran: finalTahunAjaran, selected: true, status: 'ok', message: 'Ready' }]);
     setManualInputName('');
     setIsManualModalOpen(false);
  };

  // Handlers for Copy Data
  const handleCopyData = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!copySourceTerm) return;
     
     setLoading(true);
     try {
       const res = await fetch(`/api/praktikum?action=by-term&term=${copySourceTerm}`);
       const result = await res.json();
       if (!res.ok) throw new Error(result.error);
       
       const existingPraktikums = result.data || [];
       if (existingPraktikums.length === 0) {
          toast.error('Tidak ada data praktikum di tahun ajaran tersebut');
          return;
       }

       const finalTahunAjaran = buildTermString(termYear, termSem);
       
       const newRows = existingPraktikums.map((p: any) => ({
         nama: p.nama,
         tahun_ajaran: finalTahunAjaran,
         selected: true,
         status: 'ok',
         message: 'Ready'
       }));
       
       setPreviewRows(prev => {
         const existingNames = new Set(prev.map(r => r.nama.toUpperCase()));
         const filteredNewRows = newRows.filter((r: any) => !existingNames.has(r.nama.toUpperCase()));
         
         if (filteredNewRows.length === 0) {
            toast.info('Semua praktikum dari tahun tersebut sudah ada di tabel');
         } else {
            toast.success(`Berhasil menarik ${filteredNewRows.length} nama praktikum`);
         }
         return [...prev, ...filteredNewRows];
       });
       
       setIsCopyModalOpen(false);
     } catch (err: any) {
       toast.error(err.message);
     } finally {
       setLoading(false);
     }
  };
  
  // Submit all
  const handleConfirmImport = async () => {
    const finalTahunAjaran = buildTermString(termYear, termSem);
    const selectedRows = previewRows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
       toast.error('Daftar praktikum tidak boleh kosong, harap tambah data terlebih dahulu');
       return;
    }

    // Create Draft data with temporary UUIDs
    const draftData = selectedRows.map(r => ({
      tempId: crypto.randomUUID(),
      nama: r.nama,
      tahun_ajaran: finalTahunAjaran
    }));
    
    setPraktikumList(draftData);
    toast.success('Data Praktikum berhasil disimpan ke draft sementara.');
    markStepCompleted('praktikum');
    setCurrentStep('matkul');
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Langkah 1: Master Praktikum</CardTitle>
        <CardDescription>
          Siapkan daftar Praktikum untuk Tahun Ajaran yang baru.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-2">
        <Field>
          <FieldLabel>Target Tahun Ajaran Baru</FieldLabel>
          <FieldContent>
            <TermInput
              termYear={termYear}
              termSem={termSem}
              onYearChange={setTermYear}
              onSemChange={setTermSem}
            />
          </FieldContent>
        </Field>

        <div className="pt-2 border-t space-y-4 mt-6">
          <div className="flex justify-between items-center mt-4">
            <h3 className="font-semibold text-lg">Daftar Praktikum</h3>
            <div className="flex gap-2">
              <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2"><BookOpen className="w-4 h-4"/> Tambah Manual</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Praktikum Manual</DialogTitle>
                    <DialogDescription>Masukkan nama praktikum untuk ditambahkan ke daftar.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddManual} className="space-y-4 py-4">
                    <Field>
                      <FieldLabel>Nama Praktikum</FieldLabel>
                      <FieldContent>
                        <Input value={manualInputName} onChange={e => setManualInputName(e.target.value)} placeholder="Contoh: PBO" autoFocus required />
                      </FieldContent>
                    </Field>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsManualModalOpen(false)}>Batal</Button>
                      <Button type="submit">Tambah ke Daftar</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isCopyModalOpen} onOpenChange={setIsCopyModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2"><Copy className="w-4 h-4"/> Copy dari Tahun Lalu</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tarik Data Praktikum</DialogTitle>
                    <DialogDescription>Masukkan tahun ajaran sebelumnya untuk mengambil daftar praktikumnya.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCopyData} className="space-y-4 py-4">
                    <Field>
                      <FieldLabel>Tahun Ajaran Sumber</FieldLabel>
                      <FieldContent>
                        <Select value={copySourceTerm} onValueChange={setCopySourceTerm} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Tahun Ajaran" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTerms.length === 0 ? (
                              <SelectItem value="none" disabled>Memuat data...</SelectItem>
                            ) : (
                              availableTerms.map(term => (
                                <SelectItem key={term} value={term}>{term}</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCopyModalOpen(false)}>Batal</Button>
                      <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Tarik Data
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Upload Gagal</AlertTitle>
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {previewRows.length === 0 ? (
            <div className="space-y-6">
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer',
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-transparent hover:border-primary/50'
                )}
              >
                <input {...getInputProps()} />
                <FileSpreadsheet size={40} className="mb-3 mx-auto text-muted-foreground" />
                <div className="space-y-1">
                  <p className="font-medium">Drag & drop file CSV atau Excel di sini</p>
                  <p className="text-xs text-muted-foreground">atau klik untuk pilih file (.csv, .xlsx)</p>
                </div>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-2 font-medium">
                  Format Kolom CSV/Excel yang Didukung:
                </p>
                <div className="flex flex-wrap gap-2 mb-1">
                  {['nama', 'tahun_ajaran'].map((col) => (
                    <span
                      key={col}
                      className="text-[10px] bg-background border px-1.5 py-0.5 rounded font-mono text-muted-foreground"
                    >
                      {col}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-border/50 mt-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Download size={12} />
                    Download Template:
                  </span>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2 gap-1.5" onClick={() => handleDownloadTemplate('csv')}>
                      <FileText size={12} className="text-sky-500" /> CSV
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2 gap-1.5" onClick={() => handleDownloadTemplate('xlsx')}>
                      <FileSpreadsheet size={12} className="text-emerald-500" /> XLSX
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-md">
              <div className="p-4 bg-muted/20 border-b flex justify-between items-center">
                <h3 className="font-medium text-sm">Preview Data Praktikum ({previewRows.length})</h3>
                <Button {...getRootProps()} type="button" variant="outline" size="sm" className="h-7 text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground font-medium">
                  <input {...getInputProps()} />
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Tambah via CSV/Excel
                </Button>
              </div>
              <div className="p-4 space-y-4">
                <PraktikumCSVPreview
                  rows={previewRows}
                  onToggleSelect={handleToggleSelect}
                  onToggleAll={handleToggleAll}
                />
                <div className="flex justify-between items-center pt-2">
                  <Button type="button" variant="outline" onClick={() => setPreviewRows([])} disabled={loading}>
                    Kembali
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleConfirmImport} disabled={loading || previewRows.filter(r => r.selected).length === 0} variant="default">
                      {loading ? 'Menyimpan...' : `Simpan ${previewRows.filter(r => r.selected).length} Data Terpilih`}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
