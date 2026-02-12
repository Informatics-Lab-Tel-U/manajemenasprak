/**
 * AsprakImportCSVModal — CSV Import dialog for bulk asprak entry
 *
 * Flow: 1) Enter Term → 2) Drag & drop CSV → 3) Preview → 4) Confirm save
 *
 * CSV columns: nama_lengkap, nim, kode, angkatan
 * If "kode" is empty, it is auto-generated using the code generator.
 *
 * @module components/asprak/AsprakImportCSVModal
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Upload, FileText, X, Download } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

import TermInput, { buildTermString } from './TermInput';
import AsprakCSVPreview, { PreviewRow } from './AsprakCSVPreview';
import { batchGenerateCodes } from '@/utils/asprakCodeGenerator';
import { json } from 'stream/consumers';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RawCSVRow {
  nama_lengkap?: string;
  nim?: string;
  kode?: string;
  angkatan?: string | number;
}

export interface ExistingAsprakInfo {
  kode: string;
  angkatan: number;
}

/** How many years before a code can be recycled */
const CODE_RECYCLE_YEARS = 5;

interface AsprakImportCSVModalProps {
  existingCodes: string[];
  existingNims: string[];
  existingAspraks: ExistingAsprakInfo[];
  onImport: (
    rows: { nim: string; nama_lengkap: string; kode: string; angkatan: number }[],
    term: string
  ) => Promise<void>;
  onClose: () => void;
  open: boolean;
}

// ─── Step type ───────────────────────────────────────────────────────────────

type Step = 'upload' | 'preview';

// ─── Component ───────────────────────────────────────────────────────────────

export default function AsprakImportCSVModal({
  existingCodes,
  existingNims,
  existingAspraks,
  onImport,
  onClose,
  open,
}: AsprakImportCSVModalProps) {
  // Term state
  const [termYear, setTermYear] = useState('25');
  const [termSem, setTermSem] = useState<'1' | '2'>('2');

  // Step state
  const [step, setStep] = useState<Step>('upload');

  // CSV state
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  

  // Derived
  const term = useMemo(() => buildTermString(termYear, termSem), [termYear, termSem]);
  const isTermValid = term.length > 0 && !isNaN(parseInt(termYear));

  // ─── CSV Parsing ─────────────────────────────────────────────────────────

  const processCSV = useCallback(
    (file: File) => {
      setError(null);
      setFileName(file.name);

      Papa.parse<RawCSVRow>(file, {
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

          // Validate required columns
          const firstRow = data[0];
          const requiredCols = ['nama_lengkap', 'nim'];
          const missingCols = requiredCols.filter(
            (col) => !(col in firstRow)
          );
          if (missingCols.length > 0) {
            setError(
              `Kolom wajib tidak ditemukan: ${missingCols.join(', ')}. Kolom yang ada: ${Object.keys(firstRow).join(', ')}`
            );
            return;
          }

          // Build preview rows with code generation
          try {
            const usedCodes = new Set(existingCodes.map((c) => c.toUpperCase()));
            const existingNimSet = new Set(existingNims);

            // Prepare rows for batch code generation
            const rowsForCodeGen = data.map((row) => ({
              nama_lengkap: String(row.nama_lengkap || '').trim(),
              kode: row.kode ? String(row.kode).trim() : undefined,
            }));

            const generatedCodes = batchGenerateCodes(
              rowsForCodeGen.map((r) => ({
                nama_lengkap: r.nama_lengkap,
                kode: r.kode,
              })),
              usedCodes
            );

            const preview: PreviewRow[] = [];
            const seenNimsInCSV = new Set<string>();

            for (let idx = 0; idx < data.length; idx++) {
              const row = data[idx];
              const namaLengkap = String(row.nama_lengkap || '').trim();
              const nim = String(row.nim || '').trim();
              const rawAngkatan = row.angkatan;
              let angkatan = typeof rawAngkatan === 'number' ? rawAngkatan : parseInt(String(rawAngkatan || '0'));
              if (angkatan > 0 && angkatan < 100) angkatan += 2000;

              const originalKode = row.kode ? String(row.kode).trim().toUpperCase() : '';
              const generated = generatedCodes[idx];

              // Determine status
              let status: PreviewRow['status'] = 'ok';
              let statusMessage = '';

              if (!namaLengkap) {
                status = 'error';
                statusMessage = 'Nama kosong';
              } else if (!nim) {
                status = 'error';
                statusMessage = 'NIM kosong';
              } else if (existingNimSet.has(nim)) {
                status = 'error';
                statusMessage = 'Duplikat — NIM sudah ada di database';
              } else if (seenNimsInCSV.has(nim)) {
                status = 'duplicate-csv';
                statusMessage = 'Duplikat dalam CSV — NIM sama dengan row sebelumnya';
              } else if (angkatan <= 0) {
                status = 'warning';
                statusMessage = 'Angkatan tidak valid';
              }

              // Check if code generation failed
              if (generated.rule === 'FAILED' && !originalKode && status === 'ok') {
                status = 'error';
                statusMessage = 'Kode gagal di-generate — isi manual di kolom kode';
              }

              // Track this NIM as seen in current CSV
              if (nim) seenNimsInCSV.add(nim);

              // Code source: 'csv' if the kode was provided in CSV, 'generated' if auto-generated
              const codeSource: PreviewRow['codeSource'] = originalKode ? 'csv' : 'generated';

              // For duplicate rows, use the original CSV code as-is (the code generator
              // may have auto-generated a different code because the original is already
              // "taken" in the DB — but that's expected since it belongs to the same person)
              const isDuplicate = (status === 'error' && statusMessage.includes('Duplikat')) || status === 'duplicate-csv';
              const displayKode = isDuplicate && originalKode ? originalKode : generated.code;

              const finalRule = isDuplicate ? 'Duplikat' : generated.rule;

              preview.push({
                nama_lengkap: namaLengkap.toUpperCase(),
                nim,
                kode: displayKode,
                angkatan,
                codeRule: finalRule,
                codeSource,
                status,
                statusMessage,
                // Track originals for tag revert on edit
                originalKode: displayKode,
                originalCodeRule: finalRule,
                originalCodeSource: codeSource,
              });
            }

            setPreviewRows(preview);
            setStep('preview');
          } catch (e: any) {
            setError(`Error saat generate kode: ${e.message}`);
          }
        },
        error: (err: Error) => {
          setError(`Failed to parse CSV: ${err.message}`);
        },
      });
    },
    [existingCodes, existingNims]
  );

  // ─── Inline Code Edit ─────────────────────────────────────────────────

  const handleCodeEdit = useCallback((rowIndex: number, newCode: string) => {
    setPreviewRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[rowIndex] };
      const uppercased = newCode.toUpperCase();
      row.kode = uppercased;

      // ── Tag revert: if user typed back the original code, revert tags ──
      if (uppercased === row.originalKode) {
        row.codeSource = row.originalCodeSource;
        row.codeRule = row.originalCodeRule;
      } else {
        row.codeSource = 'csv';
        row.codeRule = 'Manual edit';
      }

      // ── Real-time conflict check (only for complete 3-letter codes) ──
      if (/^[A-Z]{3}$/.test(uppercased)) {
        // Check if code is used by another row in this CSV
        const conflictInCSV = updated.some(
          (r, i) =>
            i !== rowIndex &&
            r.kode === uppercased &&
            r.status !== 'error' &&
            r.status !== 'duplicate-csv'
        );

        // Check if code exists in DB, but allow recycling if angkatan gap >= CODE_RECYCLE_YEARS
        const conflictInDB = existingAspraks.some((a) => {
          if (a.kode.toUpperCase() !== uppercased) return false;
          // Allow recycling: if the existing asprak's angkatan is old enough
          const gap = row.angkatan - a.angkatan;
          return gap < CODE_RECYCLE_YEARS; // conflict only if gap < 5 years
        });

        if (conflictInCSV) {
          row.status = 'warning';
          row.statusMessage = `Kode "${uppercased}" sudah dipakai row lain di CSV ini`;
        } else if (conflictInDB) {
          row.status = 'warning';
          row.statusMessage = `Kode "${uppercased}" sudah dipakai asprak lain di database (< ${CODE_RECYCLE_YEARS} tahun)`;
        } else {
          // Code is valid and available
          row.status = 'ok';
          row.statusMessage = '';
        }
      } else if (uppercased.length > 0 && uppercased.length < 3) {
        // Incomplete code -> ERROR
        row.status = 'error';
        row.statusMessage = 'Kode harus 3 huruf';
      } else if (uppercased.length === 0) {
        // Empty code -> ERROR
        row.status = 'error';
        row.statusMessage = 'Kode tidak boleh kosong';
      }

      updated[rowIndex] = row;
      return updated;
    });
  }, [existingAspraks]);



  // ─── Template Download ──────────────────────────────────────────────────

  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    const data = [
      { nama_lengkap: 'Budi Santoso', nim: '1301213001', kode: 'BUS', angkatan: 2021 },
      { nama_lengkap: 'Siti Aminah', nim: '1301213002', kode: '', angkatan: 2021 },
    ];

    if (format === 'csv') {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_asprak.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'template_asprak.xlsx');
    }
  };

  // ─── Drag & Drop ────────────────────────────────────────────────────────

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

  // ─── Confirm Save ───────────────────────────────────────────────────────

  const handleConfirm = async () => {
    // Include both OK and Warning rows
    const validRows = previewRows.filter((r) => r.status === 'ok' || r.status === 'warning');
    const invalidRows = previewRows.filter((r) => r.status === 'error' || r.status === 'duplicate-csv');
    
    // Only block if all rows are invalid
    if (validRows.length === 0 && invalidRows.length > 0) return;

    setSaving(true);
    setError(null);

    try {
      await onImport(
        validRows.map((r) => ({
          nim: r.nim,
          nama_lengkap: r.nama_lengkap,
          kode: r.kode,
          angkatan: r.angkatan,
        })),
        term
      );
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Back from preview ──────────────────────────────────────────────────

  const handleBack = () => {
    setStep('upload');
    setPreviewRows([]);
    setFileName(null);
    setError(null);
  };

  // ─── Reset on close ─────────────────────────────────────────────────────

  const handleClose = () => {
    setStep('upload');
    setPreviewRows([]);
    setFileName(null);
    setError(null);
    setSaving(false);
    onClose();
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          'flex max-h-[min(800px,90vh)] flex-col gap-0 p-0',
          step === 'preview' ? 'sm:max-w-4xl' : 'sm:max-w-lg'
        )}
      >
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4 flex items-center gap-2">
            <Upload size={18} />
            Import CSV Asprak
            {step === 'preview' && (
              <span className="text-sm font-normal text-muted-foreground ml-2">— Preview</span>
            )}
          </DialogTitle>

          <ScrollArea className="flex max-h-full flex-col overflow-hidden">
            <div className="px-6 py-5">
              {/* Error Alert */}
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
                  {/* Step 1: Term Input */}
                  <TermInput
                    termYear={termYear}
                    termSem={termSem}
                    onYearChange={setTermYear}
                    onSemChange={setTermSem}
                    label="Tahun Ajaran Penugasan"
                    description="Isi term terlebih dahulu sebelum upload CSV."
                  />

                  {/* Step 2: Dropzone (only enabled after term is filled) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium leading-none">Upload CSV</label>
                      {fileName && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText size={12} />
                          {fileName}
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
                          <p className="text-xs text-muted-foreground/40">
                            Dropzone akan aktif setelah term diisi
                          </p>
                        </div>
                      ) : isDragActive ? (
                        <p className="text-primary font-semibold">Drop CSV file di sini...</p>
                      ) : (
                        <div className="space-y-1">
                          <p className="font-medium">Drag & drop file CSV di sini</p>
                          <p className="text-xs text-muted-foreground">atau klik untuk pilih file</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Format Kolom:</p>
                        <div className="flex flex-wrap gap-2 mb-1">
                          {['nama_lengkap', 'nim', 'kode (opsional)', 'angkatan'].map((col) => (
                            <span key={col} className="text-[10px] bg-background border px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                              {col}
                            </span>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 mb-3">
                          * Kolom <code className="text-[9px] bg-muted px-1 rounded">kode</code> boleh kosong (akan di-generate otomatis).
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
                              onClick={() => handleDownloadTemplate('csv')}
                            >
                              <FileText size={12} className="text-sky-500" />
                              CSV
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs px-2 gap-1.5 bg-background"
                              onClick={() => handleDownloadTemplate('xlsx')}
                            >
                              <FileSpreadsheet size={12} className="text-emerald-500" />
                              XLSX
                            </Button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {step === 'preview' && (
                <AsprakCSVPreview
                  rows={previewRows}
                  term={term}
                  onConfirm={handleConfirm}
                  onBack={handleBack}
                  onCodeEdit={handleCodeEdit}
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
