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
import { BookOpen, CheckCircle2, FileSpreadsheet, Download, FileText, AlertCircle, Copy, Save, RefreshCw, Loader2 } from 'lucide-react';
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

export default function TahunAjaranBaruClient() {
  const { 
    currentStep, 
    setCurrentStep,
    draft,
    resetProgress 
  } = useOnboardingStore();
  
  const { lastSaved, isDirty } = useAutosaveStatus();

  return (
    <div className="container relative space-y-8">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Setup Tahun Ajaran Baru</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Ikuti alur ini untuk menambahkan seluruh data semester baru secara berurutan agar sesuai dengan constraint sistem.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground text-right">
            {isDirty ? (
              <span className="flex items-center gap-1 text-amber-500"><RefreshCw className="w-3 h-3 animate-spin"/> Ada perubahan belum tersimpan</span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-green-500"><Save className="w-3 h-3"/> Disimpan {lastSaved.toLocaleTimeString()}</span>
            ) : null}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10">
                Reset Progress
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Anda yakin ingin reset progress?</AlertDialogTitle>
                <AlertDialogDescription>
                  Draft dan data state saat ini akan dihapus. Data yang sudah tersimpan di database tidak akan terhapus.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={resetProgress} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Reset Progress
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <Stepper 
        steps={steps} 
        activeStep={currentStep}
        onStepChange={(id) => setCurrentStep(id as any)}
        className="flex flex-col w-full items-start gap-8"
      >
        <StepperNav className="w-full bg-card p-4 rounded-xl border shadow-sm">
          {steps.map((step, index) => (
            <StepperItem key={step.id} stepId={step.id} className="relative flex-1">
              <StepperTrigger className="flex flex-col gap-2.5 items-center">
                <StepperIndicator />
                <div className="flex flex-col items-center text-center">
                  <StepperTitle>{step.title}</StepperTitle>
                  <StepperDescription className="text-nowrap max-md:hidden">{step.description}</StepperDescription>
                </div>
              </StepperTrigger>
              {steps.length > index + 1 && (
                <StepperSeparator className="absolute inset-x-0 top-3 right-[calc(-50%+18px)] left-[calc(50%+18px)]" />
              )}
            </StepperItem>
          ))}
        </StepperNav>

        <div className="w-full">
          <StepperContent value="praktikum">
            <PraktikumStep />
          </StepperContent>
          <StepperContent value="matkul">
            <MatkulStep />
          </StepperContent>
          <StepperContent value="jadwal">
            <PreviewStep />
          </StepperContent>
          <StepperContent value="selesai">
            <SelesaiStep />
          </StepperContent>
        </div>
      </Stepper>
    </div>
  );
}

// --------------------------------------------------------------------------------
// STEPS COMPONENTS
// --------------------------------------------------------------------------------

function PraktikumStep() {
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
              <div className="p-4">
                <PraktikumCSVPreview
                  rows={previewRows}
                  onConfirm={handleConfirmImport}
                  onBack={() => setPreviewRows([])}
                  onToggleSelect={handleToggleSelect}
                  onToggleAll={handleToggleAll}
                  loading={loading}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


function MatkulStep() {
  const { stepper } = useStepper();
  const { draft, setMataKuliahList, markStepCompleted, setCurrentStep } = useOnboardingStore();
  const { activeTerm } = useTermStore();

  const praktikumList = draft.praktikumList || [];
  const validPraktikums = praktikumList.map(p => ({ id: p.tempId, nama: p.nama }));
  const term = praktikumList[0]?.tahun_ajaran || activeTerm || '';

  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [previewRows, setPreviewRows] = useState<MataKuliahCSVRow[]>(() => {
    return draft.mataKuliahData?.map(m => {
      const p = praktikumList.find(p => p.tempId === m.id_praktikum);
      return {
        mk_singkat: p?.nama || '',
        originalMkSingkat: p?.nama || '',
        nama_lengkap: m.nama_lengkap,
        program_studi: m.program_studi,
        dosen_koor: m.dosen_koor || '',
        status: 'ok',
        selected: true,
        mappedPraktikumId: m.id_praktikum
      };
    }) || [];
  });

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    id_praktikum: praktikumList.length > 0 ? praktikumList[0].tempId : '', 
    namaLengkap: '', 
    programStudi: 'IF', 
    dosenKoor: '' 
  });

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
        
        const preview = validateMataKuliahData(data, validPraktikums, []);
        const strictPreview = preview.map(r => {
          if (!r.statusMessage?.includes('Praktikum baru akan dibuat otomatis')) return r;
          return {
            ...r,
            status: 'error' as const,
            statusMessage: 'Praktikum tidak ditemukan di Langkah 1',
            selected: false
          };
        });

        setPreviewRows(prev => [...prev, ...strictPreview]);
      },
      error: (err: Error) => setUploadError(`Failed to parse CSV: ${err.message}`),
    });
  }, [validPraktikums]);
  
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

            const preview = validateMataKuliahData(jsonData, validPraktikums, []);
            const strictPreview = preview.map(r => {
              if (!r.statusMessage?.includes('Praktikum baru akan dibuat otomatis')) return r;
              return {
                ...r,
                status: 'error' as const,
                statusMessage: 'Praktikum tidak ditemukan di Langkah 1',
                selected: false
              };
            });

            setPreviewRows(prev => [...prev, ...strictPreview]);
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
  }, [processCSV, validPraktikums]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
  });

  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    const data = [
      { mk_singkat: 'ALPRO 1', nama_lengkap: 'ALGORITMA PEMROGRAMAN 1', program_studi: 'IF', dosen_koor: 'PEY' },
      { mk_singkat: 'STD', nama_lengkap: 'STRUKTUR DATA', program_studi: 'SE-PJJ', dosen_koor: 'HUI' },
    ];
    if (format === 'csv') {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_matakuliah.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'template_matakuliah.xlsx');
    }
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id_praktikum || !formData.namaLengkap || !formData.programStudi) {
      toast.error('Isi kolom yang wajib');
      return;
    }
    
    const prak = praktikumList.find(p => p.tempId === formData.id_praktikum);
    if (!prak) return;

    setPreviewRows(prev => [...prev, {
      mk_singkat: prak.nama,
      originalMkSingkat: prak.nama,
      nama_lengkap: formData.namaLengkap,
      program_studi: formData.programStudi,
      dosen_koor: formData.dosenKoor,
      status: 'ok',
      selected: true,
      mappedPraktikumId: formData.id_praktikum
    }]);

    setFormData(prev => ({ ...prev, namaLengkap: '', dosenKoor: '' }));
    setIsManualModalOpen(false);
  };

  const handleCopyData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copySourceTerm) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/mata-kuliah?term=${copySourceTerm}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      const existingMkGroups = result.data || [];
      if (existingMkGroups.length === 0) {
         toast.error('Tidak ada data mata kuliah di tahun ajaran tersebut');
         return;
      }

      const flattened = existingMkGroups.flatMap((g: any) => g.items.map((item: any) => ({
        mk_singkat: g.mk_singkat,
        nama_lengkap: item.nama_lengkap,
        program_studi: item.program_studi,
        dosen_koor: item.dosen_koor || ''
      })));

      const preview = validateMataKuliahData(flattened, validPraktikums, []);
      const strictPreview = preview.map(r => {
        if (!r.statusMessage?.includes('Praktikum baru akan dibuat otomatis')) return r;
        return {
          ...r,
          status: 'error' as const,
          statusMessage: 'Praktikum tidak ditemukan di Langkah 1',
          selected: false
        };
      });

      setPreviewRows(prev => {
         toast.success(`Berhasil menarik ${strictPreview.length} mata kuliah`);
         return [...prev, ...strictPreview];
      });
      
      setIsCopyModalOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRow = (index: number, updates: Partial<MataKuliahCSVRow>) => {
    setPreviewRows((prev) => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], ...updates };
      return newRows;
    });
  };

  const handleToggleSelect = (index: number) => {
    setPreviewRows((prev) => {
      const newRows = [...prev];
      newRows[index].selected = !newRows[index].selected;
      return newRows;
    });
  };

  const handleToggleAll = (checked: boolean) => {
    setPreviewRows((prev) => prev.map((r) => ({
      ...r,
      selected: r.status === 'error' ? false : checked,
    })));
  };

  const handleConfirmImport = async () => {
    const selectedRows = previewRows.filter((r) => r.selected);
    
    const draftData = selectedRows.map(r => {
      let id_praktikum = r.mappedPraktikumId;
      if (!id_praktikum) {
        const prak = praktikumList.find(p => p.nama.toUpperCase() === r.mk_singkat.toUpperCase());
        id_praktikum = prak?.tempId;
      }

      return {
        id_praktikum,
        nama_lengkap: r.nama_lengkap,
        program_studi: r.program_studi,
        dosen_koor: r.dosen_koor
      };
    });

    const validDraftData = draftData.filter(d => d.id_praktikum) as any;

    if (validDraftData.length === 0 && selectedRows.length > 0) {
      toast.error('Gagal memetakan Mata Kuliah ke Praktikum.');
      return;
    }

    setMataKuliahList(validDraftData);
    toast.success('Data Mata Kuliah berhasil disimpan ke draft sementara.');
    markStepCompleted('matkul');
    setCurrentStep('jadwal');
  };

  const handleSkip = () => {
    setMataKuliahList([]);
    markStepCompleted('matkul');
    setCurrentStep('jadwal');
  };

  return (
    <Card className="border shadow-sm w-full">
      <CardHeader>
        <CardTitle className="text-xl">Langkah 2: Mata Kuliah</CardTitle>
        <CardDescription>
          Tambahkan Mata Kuliah untuk Praktikum yang telah Anda daftarkan di Langkah 1. (Opsional, Anda bisa menambahkan nanti).
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-2">
        <div className="pt-2 space-y-4">
          <div className="flex justify-between items-center mt-4">
            <h3 className="font-semibold text-lg">Daftar Mata Kuliah</h3>
            <div className="flex gap-2">
              <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2"><BookOpen className="w-4 h-4"/> Tambah Manual</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Mata Kuliah Manual</DialogTitle>
                    <DialogDescription>Masukkan detail mata kuliah untuk ditambahkan ke daftar.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddManual} className="space-y-4 py-4">
                    <Field>
                      <FieldLabel>Pilih Praktikum Induk <span className="text-destructive">*</span></FieldLabel>
                      <FieldContent>
                        <Select value={formData.id_praktikum} onValueChange={(val) => setFormData(prev => ({ ...prev, id_praktikum: val }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Praktikum" />
                          </SelectTrigger>
                          <SelectContent>
                            {praktikumList.map(p => (
                              <SelectItem key={p.tempId} value={p.tempId}>{p.nama} ({p.tahun_ajaran})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel>Nama Mata Kuliah <span className="text-destructive">*</span></FieldLabel>
                      <FieldContent>
                        <Input 
                          placeholder="Contoh: Pemrograman Web Lanjut" 
                          value={formData.namaLengkap}
                          onChange={(e) => setFormData(prev => ({ ...prev, namaLengkap: e.target.value }))}
                          required
                        />
                      </FieldContent>
                    </Field>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel>Program Studi <span className="text-destructive">*</span></FieldLabel>
                        <FieldContent>
                          <Input 
                            placeholder="Contoh: IF"
                            value={formData.programStudi}
                            onChange={(e) => setFormData(prev => ({ ...prev, programStudi: e.target.value }))}
                            required
                          />
                        </FieldContent>
                      </Field>
                      <Field>
                        <FieldLabel>Dosen Koor</FieldLabel>
                        <FieldContent>
                          <Input 
                            placeholder="Opsional (3 Huruf)" 
                            value={formData.dosenKoor}
                            onChange={(e) => setFormData(prev => ({ ...prev, dosenKoor: e.target.value }))}
                            maxLength={3}
                          />
                        </FieldContent>
                      </Field>
                    </div>
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
                    <DialogTitle>Tarik Data Mata Kuliah</DialogTitle>
                    <DialogDescription>Masukkan tahun ajaran sebelumnya untuk mengambil daftar mata kuliahnya.</DialogDescription>
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
                              availableTerms.map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
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
                  {['mk_singkat', 'nama_lengkap', 'program_studi', 'dosen_koor'].map((col) => (
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
            <div className="border rounded-md flex flex-col h-[600px] overflow-hidden">
              <div className="p-4 bg-muted/20 border-b flex justify-between items-center shrink-0">
                <h3 className="font-medium text-sm">Preview Data Mata Kuliah ({previewRows.length})</h3>
                <Button {...getRootProps()} type="button" variant="outline" size="sm" className="h-7 text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground font-medium">
                  <input {...getInputProps()} />
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Tambah via CSV/Excel
                </Button>
              </div>
              <div className="flex-1 min-h-0 relative">
                <MataKuliahCSVPreview
                  rows={previewRows}
                  loading={loading}
                  validPraktikums={validPraktikums}
                  term={term}
                  onConfirm={handleConfirmImport}
                  onBack={() => setPreviewRows([])}
                  onUpdateRow={handleUpdateRow}
                  onToggleSelect={handleToggleSelect}
                  onToggleAll={handleToggleAll}
                  onSkip={handleSkip}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
      {previewRows.length === 0 && (
        <CardFooter className="justify-between pt-4 pb-6 bg-muted/10 border-t">
          <Button type="button" variant="ghost" onClick={() => setCurrentStep('praktikum')}>Kembali</Button>
          <Button onClick={handleSkip} variant="secondary">Lewati Langkah Ini</Button>
        </CardFooter>
      )}
    </Card>
  );
}



function PreviewStep() {
  const { draft, setCurrentStep, markStepCompleted } = useOnboardingStore();
  const [loading, setLoading] = useState(false);

  const praktikumList = draft.praktikumList || [];
  const mkList = draft.mataKuliahData || [];

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const payload = {
        praktikumList,
        mataKuliahList: mkList
      };

      const res = await fetch('/api/tahun-ajaran/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || 'Gagal menyimpan data ke database');
      
      toast.success('Semua data berhasil disimpan ke Database!');
      markStepCompleted('jadwal');
      setCurrentStep('selesai');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Langkah 3: Preview & Simpan Permanen</CardTitle>
        <CardDescription>
          Harap periksa kembali draf Praktikum dan Mata Kuliah Anda sebelum menyimpannya secara permanen ke Database.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="space-y-4">
          {praktikumList.map((prak, pIdx) => {
            const mks = mkList.filter(mk => mk.id_praktikum === prak.tempId);
            return (
              <div key={prak.tempId} className="border rounded-lg p-4 bg-muted/5">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{pIdx + 1}</div>
                    <h3 className="font-semibold text-lg">{prak.nama} <span className="text-sm font-normal text-muted-foreground">({prak.tahun_ajaran})</span></h3>
                  </div>
                </div>
                {mks.length > 0 ? (
                  <div className="pl-8 space-y-2">
                    {mks.map((mk, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm border-l-2 pl-3 py-1">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span>{mk.nama_lengkap} <span className="text-muted-foreground">- {mk.program_studi}</span></span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="pl-8 text-sm text-muted-foreground italic">Tidak ada Mata Kuliah</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="justify-between pt-4 pb-6 bg-muted/10 border-t">
        <Button type="button" variant="ghost" onClick={() => setCurrentStep('matkul')} disabled={loading}>Kembali</Button>
        <Button onClick={handleSaveAll} disabled={loading} size="lg">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan ke Database
        </Button>
      </CardFooter>
    </Card>
  );
}

function SelesaiStep() {
  const { resetProgress } = useOnboardingStore();

  const handleFinish = () => {
    resetProgress();
    window.location.href = '/';
  };

  return (
    <Card className="border shadow-sm bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto bg-green-500/10 p-4 rounded-full w-fit mb-4">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <CardTitle className="text-2xl text-green-700 dark:text-green-500">Tahun Ajaran Berhasil Diinisialisasi!</CardTitle>
        <CardDescription className="text-base mt-2">
          Pondasi data Anda sudah terbentuk. Tahun ajaran baru sudah tersedia di <strong>Global Term Selector</strong> di pojok kanan atas.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          Jangan lupa untuk melengkapi Konfigurasi Tanggal Modul di halaman <br/>
          <strong>Jadwal Praktikum &gt; Tanggal Mulai Modul</strong>.
        </p>
      </CardContent>
      <CardFooter className="justify-center pt-6 pb-8">
        <Button size="lg" onClick={handleFinish}>Selesai & Kembali ke Dashboard</Button>
      </CardFooter>
    </Card>
  );
}
