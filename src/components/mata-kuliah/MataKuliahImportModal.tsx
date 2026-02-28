import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Upload, FileText, X, Download } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { cn } from '@/lib/utils'; // Ensure utility exists or use standard class string

import TermInput, { buildTermString } from '@/components/asprak/TermInput';
import MataKuliahCSVPreview, { MataKuliahCSVRow } from './MataKuliahCSVPreview';
import type { MataKuliahGrouped } from '@/services/mataKuliahService';

interface MataKuliahImportModalProps {
  open: boolean;
  onClose: () => void;
  validPraktikums: { id: string; nama: string }[];
  onImport: (rows: any[], term: string) => Promise<void>;
  defaultTerm?: string;
}

export default function MataKuliahImportModal({
  open,
  onClose,
  validPraktikums,
  onImport,
  defaultTerm,
}: MataKuliahImportModalProps) {
  // Parse default term if provided (e.g. "2425-1")
  const initialYear = defaultTerm ? defaultTerm.substring(0, 2) : '25';
  const initialSem = defaultTerm && defaultTerm.endsWith('2') ? '2' : '1';

  const [termYear, setTermYear] = useState(initialYear);
  const [termSem, setTermSem] = useState<'1' | '2'>(initialSem);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<MataKuliahCSVRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [localValidPraktikums, setLocalValidPraktikums] = useState(validPraktikums);
  const [existingMataKuliah, setExistingMataKuliah] = useState<MataKuliahGrouped[]>([]);

  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Sync initial validPraktikums if they change (though we override with fetch mostly)
  useEffect(() => {
    setLocalValidPraktikums(validPraktikums);
  }, [validPraktikums]);

  // Derived
  const term = useMemo(() => buildTermString(termYear, termSem), [termYear, termSem]);
  const isTermValid = term.length > 0 && !isNaN(parseInt(termYear));

  const isValidProdi = (prodi: string) => {
    const base = prodi?.replace('-PJJ', '') || '';
    return ['IF', 'IT', 'SE', 'DS'].includes(base);
  };

  // Fetch valid praktikums AND key existing data whenever the term changes inside the modal
  useEffect(() => {
    let active = true;

    async function fetchData() {
      if (!isTermValid) return;

      try {
        const [praktikumRes, mkRes] = await Promise.all([
          fetch(`/api/praktikum?action=by-term&term=${term}`),
          fetch(`/api/mata-kuliah?term=${term}`),
        ]);

        if (active && praktikumRes.ok) {
          const json = await praktikumRes.json();
          if (json.ok && Array.isArray(json.data)) {
            setLocalValidPraktikums(json.data);
          } else {
            setLocalValidPraktikums([]);
          }
        }

        if (active && mkRes.ok) {
          const mkJson = await mkRes.json();
          if (mkJson.ok && Array.isArray(mkJson.data)) {
            setExistingMataKuliah(mkJson.data);
          } else {
            setExistingMataKuliah([]);
          }
        }
      } catch (e: any) {
        console.error(e);
      }
    }

    fetchData();
    return () => {
      active = false;
    };
  }, [term, isTermValid]);

  const processCSV = useCallback(
    (file: File) => {
      setError(null);
      setFileName(file.name);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
        complete: (results) => {
          const rows = results.data as any[];

          if (rows.length === 0) {
            setError('File CSV kosong.');
            return;
          }

          // Validate headers
          const required = ['mk_singkat', 'nama_lengkap', 'program_studi', 'dosen_koor'];
          const headers = Object.keys(rows[0]);
          const missing = required.filter((r) => !headers.includes(r));

          if (missing.length > 0) {
            setError(`Kolom wajib kurang: ${missing.join(', ')}`);
            return;
          }

          const transformed: MataKuliahCSVRow[] = rows.map((r: any) => {
            const mk_singkat = r.mk_singkat?.trim() || '';
            const nama_lengkap = r.nama_lengkap?.trim() || '';
            const program_studi = r.program_studi?.trim() || '';
            const dosen_koor = r.dosen_koor?.trim() || '';

            // Use localValidPraktikums for validation
            const isMkKnown = localValidPraktikums.some((p) => p.nama === mk_singkat);
            const isProdiValid = isValidProdi(program_studi);
            const isKoorValid = dosen_koor.length === 3;

            let status: 'ok' | 'warning' | 'error' = 'ok';
            let statusMessage = '';

            // Check Duplicates
            // existingMataKuliah is grouped by mk_singkat
            const existingGroup = existingMataKuliah.find((g) => g.mk_singkat === mk_singkat);
            const isDuplicate = existingGroup?.items.some(
              (item) =>
                item.nama_lengkap === nama_lengkap &&
                item.program_studi === program_studi &&
                item.dosen_koor === dosen_koor
            );

            if (isDuplicate) {
              status = 'error';
              statusMessage = 'Data Duplikat di Database';
            } else if (!isKoorValid || !isProdiValid) {
              status = 'error';
              statusMessage = 'Data Tidak Valid (Prodi/Dosen)';
            } else if (!isMkKnown) {
              // Allow unknown MK - it will be created automatically by backend
              status = 'ok';
              statusMessage = 'Praktikum baru akan dibuat otomatis';
            } else if (!mk_singkat || !nama_lengkap) {
              status = 'error';
              statusMessage = 'Field Wajib Kurang';
            }

            return {
              mk_singkat,
              nama_lengkap,
              program_studi,
              dosen_koor,
              status,
              statusMessage,
              originalMkSingkat: mk_singkat,
              selected: status !== 'error', // Default select valid rows
            };
          });

          setParsedRows(transformed);
          setStep('preview');
        },
        error: (err) => {
          setError(`Error parsing CSV: ${err.message}`);
        },
      });
    },
    [localValidPraktikums, existingMataKuliah]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      processCSV(file);
    },
    [processCSV]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    disabled: !isTermValid,
  });

  const handleUpdateRow = (index: number, updates: Partial<MataKuliahCSVRow>) => {
    const newRows = [...parsedRows];
    newRows[index] = { ...newRows[index], ...updates };
    setParsedRows(newRows);
  };

  const handleToggleSelect = (index: number) => {
    const newRows = [...parsedRows];
    newRows[index].selected = !newRows[index].selected;
    setParsedRows(newRows);
  };

  const handleToggleAll = (checked: boolean) => {
    const newRows = parsedRows.map((r) => ({
      ...r,
      selected: r.status === 'error' ? false : checked,
    }));
    setParsedRows(newRows);
  };

  const handleConfirmImport = async () => {
    try {
      const selectedRows = parsedRows.filter((r) => r.selected);
      if (selectedRows.length === 0) {
        toast.error('Pilih setidaknya satu baris.');
        return;
      }

      setLoading(true);
      const rowsToImport = selectedRows.map((r) => ({
        mk_singkat: r.mk_singkat,
        nama_lengkap: r.nama_lengkap,
        program_studi: r.program_studi,
        dosen_koor: r.dosen_koor,
      }));

      await onImport(rowsToImport, term);
      onClose();
      setStep('upload');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = (format: 'csv' | 'xlsx') => {
    const data = [
      {
        mk_singkat: 'ALPRO 1',
        nama_lengkap: 'ALGORITMA PEMROGRAMAN 1',
        program_studi: 'IF',
        dosen_koor: 'PEY',
      },
      {
        mk_singkat: 'STD',
        nama_lengkap: 'STRUKTUR DATA',
        program_studi: 'SE-PJJ',
        dosen_koor: 'HUI',
      },
    ];

    if (format === 'csv') {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'template_mata_kuliah.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'template_mata_kuliah.xlsx');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setFileName(null);
    setError(null);
    setParsedRows([]);
    setExistingMataKuliah([]);
    onClose();
  };

  const handleAttemptClose = (isOpen: boolean) => {
    if (!isOpen) {
      // User trying to close
      if (step === 'preview') {
        setShowConfirmClose(true);
      } else {
        handleClose();
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleAttemptClose}>
        <DialogContent
          className={cn(
            'flex flex-col gap-0 p-0 transition-all duration-200',
            step === 'preview'
              ? 'w-[95vw] !max-w-[1200px] h-[90vh]'
              : 'sm:max-w-lg max-h-[min(800px,90vh)]'
          )}
          onPointerDownOutside={(e) => {
            if (step === 'preview') {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="border-b px-6 py-4 flex items-center gap-2 shrink-0">
              <Upload size={18} />
              Import Data Mata Kuliah
              {step === 'preview' && (
                <span className="text-sm font-normal text-muted-foreground ml-2">— Pratinjau</span>
              )}
            </DialogTitle>
          </DialogHeader>

          {step === 'upload' && (
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="px-6 py-5">
                {error && (
                  <Alert className="mb-4 border-destructive/50 text-destructive">
                    <AlertDescription className="flex items-start gap-2">
                      <X size={16} className="mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </AlertDescription>
                  </Alert>
                )}

                <FieldGroup className="space-y-6">
                  <Field>
                    <TermInput
                      termYear={termYear}
                      termSem={termSem}
                      onYearChange={setTermYear}
                      onSemChange={setTermSem}
                      label="Tahun Ajaran Target"
                      description="Pilih tahun ajaran untuk data yang akan diimport."
                    />
                  </Field>

                  <Field className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FieldLabel className="text-sm font-medium leading-none">Upload CSV</FieldLabel>
                      {fileName && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText size={12} /> {fileName}
                        </span>
                      )}
                    </div>

                    <div
                      {...getRootProps()}
                      className={cn(
                        'border-2 border-dashed rounded-lg p-10 text-center transition-all',
                        !isTermValid
                          ? 'border-border/50 bg-muted/20 cursor-not-allowed opacity-50'
                          : isDragActive
                            ? 'border-primary bg-primary/5 cursor-copy'
                            : 'border-border bg-transparent hover:border-primary/50 cursor-pointer'
                      )}
                    >
                      <input {...getInputProps()} />
                      <FileSpreadsheet
                        size={40}
                        className={cn(
                          'mb-3 mx-auto',
                          isTermValid ? 'text-muted-foreground' : 'text-muted-foreground/40'
                        )}
                      />

                      {!isTermValid ? (
                        <div className="space-y-1">
                          <p className="font-medium text-muted-foreground/60">
                            Isi tahun ajaran terlebih dahulu
                          </p>
                        </div>
                      ) : isDragActive ? (
                        <p className="text-primary font-semibold">Drop CSV file di sini...</p>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-medium">Drag & drop file CSV di sini</p>
                          <p className="text-xs text-muted-foreground">
                            atau klik untuk pilih file
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">
                          Format Kolom:
                        </p>
                        <div className="flex flex-wrap gap-2 mb-1">
                          {['mk_singkat', 'nama_lengkap', 'program_studi', 'dosen_koor'].map(
                            (col) => (
                              <span
                                key={col}
                                className="text-[10px] bg-background border px-1.5 py-0.5 rounded font-mono text-muted-foreground"
                              >
                                {col}
                              </span>
                            )
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 mb-3">
                          * Prodi harus valid (IF, IT, SE, DS). Dosen harus 3 huruf.
                        </p>

                        <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Download size={12} />
                            Download Template:
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2 gap-1.5 bg-background"
                              onClick={() => downloadTemplate('csv')}
                            >
                              <FileText size={12} className="text-sky-500" /> CSV
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2 gap-1.5 bg-background"
                              onClick={() => downloadTemplate('xlsx')}
                            >
                              <FileSpreadsheet size={12} className="text-emerald-500" /> XLSX
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Field>
                </FieldGroup>
              </div>
            </ScrollArea>
          )}

          {step === 'preview' && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-background/50">
              <MataKuliahCSVPreview
                rows={parsedRows}
                loading={loading}
                validPraktikums={localValidPraktikums}
                term={term}
                onConfirm={handleConfirmImport}
                onBack={() => setStep('upload')}
                onUpdateRow={handleUpdateRow}
                onToggleSelect={handleToggleSelect}
                onToggleAll={handleToggleAll}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Import?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda sedang dalam proses import. Jika Anda keluar sekarang, data pratinjau akan hilang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal, kembali ke pratinjau</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClose}
              variant="destructive"
            >
              Ya, Batalkan Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

