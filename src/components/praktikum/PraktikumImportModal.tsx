
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Upload, FileText, X, Download } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// Import the Preview Component
import PraktikumCSVPreview, { PraktikumPreviewRow } from './PraktikumCSVPreview';
// Import Validation Logic
import { validatePraktikumData } from '@/utils/validation/praktikumValidation';

// We reuse TermInput to set the term globally? 
// Or do we read term from CSV?
// Requirement says: "csv/xlsx nya adalah kolom nama_singkat, tahun_ajaran".
// So term is IN the CSV. We don't need TermInput for the whole import, but maybe as a default?
// Actually, if tahun_ajaran is in CSV, we should use it.
// If it's missing, maybe we can ask for a default term.
// Let's assume it's in CSV as per requirement.

interface PraktikumImportModalProps {
  onImport: (rows: { nama: string; tahun_ajaran: string }[]) => Promise<void>;
  onClose: () => void;
  open: boolean;
  existingPraktikums: { nama: string; tahun_ajaran: string }[]; // To check duplicates locally if needed
}

type Step = 'upload' | 'preview';

export default function PraktikumImportModal({
  onImport,
  onClose,
  open,
  existingPraktikums
}: PraktikumImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<PraktikumPreviewRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // CSV Parsing
  const processCSV = useCallback(
    (file: File) => {
      setError(null);
      setFileName(file.name);

      Papa.parse<any>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_'),
        complete: (results) => {
          const { data, errors } = results;

          if (errors.length > 0) {
            setError(`CSV parsing error: ${errors[0].message}`);
            return;
          }

          if (data.length === 0) {
            setError('CSV kosong — tidak ada data yang ditemukan.');
            return;
          }

          // Validate columns: nama_singkat (mapped to nama), tahun_ajaran
          // Or just 'nama' and 'tahun_ajaran'?
          // User said: "kolom nama_singkat, tahun_ajaran".
          // I will look for 'nama_singkat' OR 'nama'.
          
          const preview = validatePraktikumData(data, existingPraktikums);

          setPreviewRows(preview);
          setStep('preview');
        },
        error: (err: Error) => {
            setError(`Failed to parse CSV: ${err.message}`);
        }
      });
    },
    [existingPraktikums]
  );
  
  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    const data = [
      { nama_singkat: 'PBO', tahun_ajaran: '2425-2' },
      { nama_singkat: 'JARKOM', tahun_ajaran: '2425-2' },
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
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'template_praktikum.xlsx');
    }
  };

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
  });

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
    setPreviewRows((prev) => {
      return prev.map((row) => {
        if (row.status !== 'error' && row.status !== 'skipped') {
          return { ...row, selected: checked };
        }
        return row;
      });
    });
  }, []);

  const handleConfirm = async () => {
    const selectedRows = previewRows.filter((r) => r.selected);
    if (selectedRows.length === 0) return;

    setSaving(true);
    setError(null);

    try {
        await onImport(selectedRows.map(r => ({
            nama: r.nama,
            tahun_ajaran: r.tahun_ajaran
        })));
    } catch (e: any) {
        setError(e.message || 'Gagal menyimpan data.');
    } finally {
        setSaving(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setPreviewRows([]);
    setFileName(null);
    setError(null);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
          'flex max-h-[min(800px,90vh)] flex-col gap-0 p-0',
          step === 'preview' ? 'sm:max-w-4xl' : 'sm:max-w-lg'
        )}>
         <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="border-b px-6 py-4 flex items-center gap-2">
                <Upload size={18} />
                Import Praktikum CSV
            </DialogTitle>
            <ScrollArea className="flex max-h-full flex-col overflow-hidden">
                <div className="px-6 py-5">
                    {error && (
                        <Alert className="mb-4 border-destructive/50 text-destructive">
                            <AlertDescription className="flex items-start gap-2">
                                <X size={16} className="mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </AlertDescription>
                        </Alert>
                    )}

                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
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
                                        <p className="font-medium">Drag & drop file CSV di sini</p>
                                        <p className="text-xs text-muted-foreground">atau klik untuk pilih file</p>
                                    </div>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                                    <p className="text-xs text-muted-foreground mb-2 font-medium">Format Kolom:</p>
                                    <div className="flex flex-wrap gap-2 mb-1">
                                        {['nama_singkat', 'tahun_ajaran'].map((col) => (
                                            <span key={col} className="text-[10px] bg-background border px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                                                {col}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                            <Download size={12} />
                                            Download Template:
                                        </span>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="h-7 text-xs px-2 gap-1.5" onClick={() => handleDownloadTemplate('csv')}>
                                                <FileText size={12} className="text-sky-500" /> CSV
                                            </Button>
                                            <Button variant="outline" size="sm" className="h-7 text-xs px-2 gap-1.5" onClick={() => handleDownloadTemplate('xlsx')}>
                                                <FileSpreadsheet size={12} className="text-emerald-500" /> XLSX
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <PraktikumCSVPreview
                            rows={previewRows}
                            onConfirm={handleConfirm}
                            onBack={() => {
                                setStep('upload');
                                setPreviewRows([]);
                                setFileName(null);
                            }}
                            onToggleSelect={handleToggleSelect}
                            onToggleAll={handleToggleAll}
                            loading={saving}
                        />
                    )}
                </div>
            </ScrollArea>
         </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

