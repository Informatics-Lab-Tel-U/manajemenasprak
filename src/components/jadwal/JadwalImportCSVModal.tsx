'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  FileText,
  X,
  Download,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Save,
  CheckCircle,
} from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MataKuliah } from '@/types/database';
import type { CreateJadwalInput } from '@/services/jadwalService';
import * as jadwalFetcher from '@/lib/fetchers/jadwalFetcher';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RawCSVRow {
  kelas?: string;
  nama_singkat?: string; // Replaced mata_kuliah with nama_singkat to match Excel
  hari?: string;
  sesi?: string | number;
  jam?: string;
  ruangan?: string;
  total_asprak?: string | number;
  dosen?: string;
  // allow legacy column just in case
  mata_kuliah?: string;
}

interface JadwalPreviewRow extends CreateJadwalInput {
  status: 'ok' | 'error' | 'warning';
  statusMessage: string;
  mkName: string; // Original MK name from CSV or derived for display
  fromSystemLogic: boolean; // Tells UI if mkName was auto-matched
  selected: boolean;
  originalRow?: number;
}

interface JadwalImportCSVModalProps {
  mataKuliahList: MataKuliah[];
  onImport: (rows: CreateJadwalInput[]) => Promise<void>;
  onClose: () => void;
  open: boolean;
  term?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const REQUIRED_COLS = ['kelas', 'hari', 'sesi', 'jam', 'ruangan']; // removed mata_kuliah, checking nama_singkat dynamically
const VALID_DAYS = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

// ─── Component ───────────────────────────────────────────────────────────────

export default function JadwalImportCSVModal({
  mataKuliahList,
  onImport,
  onClose,
  open,
  term,
}: JadwalImportCSVModalProps) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<JadwalPreviewRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ─── Conflict Validation ───────────────────────────────────────────────────

  const validateConflicts = async (rows: JadwalPreviewRow[]): Promise<JadwalPreviewRow[]> => {
    if (!term) return rows;

    // 1. Fetch existing schedule from DB
    const dbResult = await jadwalFetcher.fetchScheduleForValidation(term);
    const dbSchedule = dbResult.ok ? dbResult.data || [] : [];

    // Helper to generate key
    const getKey = (hari: string, sesi: number | string, ruangan: string) =>
      `${hari}-${sesi}-${ruangan}`;
    const getFullKey = (
      id_mk: string,
      kelas: string,
      hari: string,
      sesi: number,
      ruangan: string
    ) => `${id_mk}-${kelas}-${hari}-${sesi}-${ruangan}`;

    // Build Maps
    const dbMap = new Map<string, any>();
    const dbFullMap = new Set<string>();

    dbSchedule.forEach((s: any) => {
      if (s.ruangan) {
        dbMap.set(getKey(s.hari, s.sesi, s.ruangan), s);
        // Also track full check for duplicates
        dbFullMap.add(getFullKey(s.id_mk.toString(), s.kelas, s.hari, s.sesi, s.ruangan));
      }
    });

    // Internal Map to track CSV-internal conflicts
    const internalMap = new Map<string, number[]>(); // Key -> Array of Row Indexes

    // First pass: Populate internal map
    rows.forEach((row, idx) => {
      if (row.status === 'error' || !row.ruangan) return;
      const key = getKey(row.hari, row.sesi, row.ruangan);
      if (!internalMap.has(key)) {
        internalMap.set(key, []);
      }
      internalMap.get(key)?.push(idx);
    });

    // Second pass: Apply validations
    // We map to new objects to avoid mutating state directly if we were using it,
    // but here we are processing before setting state.
    return rows.map((row) => {
      const newRow = { ...row };

      if (newRow.status === 'error') return newRow;

      // Check Exact Duplicate first (id_mk + kelas + hari + sesi + ruangan)
      const fullKey = getFullKey(
        newRow.id_mk,
        newRow.kelas,
        newRow.hari,
        newRow.sesi,
        newRow.ruangan || ''
      );
      if (dbFullMap.has(fullKey)) {
        newRow.status = 'error';
        newRow.statusMessage = 'Duplikat: Jadwal ini sudah ada di database.';
        newRow.selected = false;
        return newRow;
      }

      // Check Internal Conflict
      if (newRow.ruangan) {
        const isCurrentPJJ = newRow.kelas.toUpperCase().includes('PJJ');
        const key = getKey(newRow.hari, newRow.sesi, newRow.ruangan);
        const conflictingIndices = internalMap.get(key) || [];

        // Tabrakan Internal CSV: PJJ is ignored from tabrakan with regular classes,
        // but can clash with another PJJ? Let's simply allow PJJ to overlap freely.
        // We filter out conflicts where the OTHER class is PJJ.
        const activeConflicts = conflictingIndices.filter(
          (idx) => !rows[idx].kelas.toUpperCase().includes('PJJ')
        );

        // If the current is NOT PJJ and there's another regular class
        if (!isCurrentPJJ && activeConflicts.length > 1) {
          newRow.status = 'error';
          newRow.statusMessage = `Tabrakan Internal CSV (Baris ${activeConflicts.map((i) => rows[i].originalRow).join(', ')})`;
          newRow.selected = false;
          return newRow;
        }

        // Check DB Conflict
        if (dbMap.has(key)) {
          const existing = dbMap.get(key);
          const isExistingPJJ = existing.kelas.toUpperCase().includes('PJJ');

          if (!isCurrentPJJ && !isExistingPJJ) {
            newRow.status = 'error';
            newRow.statusMessage = `Tabrakan Database: Ruangan ${newRow.ruangan} dipakai ${existing.mata_kuliah?.nama_lengkap || 'MK lain'} (${existing.kelas})`;
            newRow.selected = false;
            return newRow;
          }
        }
      }

      return newRow;
    });
  };

  // ─── CSV Parsing ─────────────────────────────────────────────────────────

  const processAndValidate = useCallback(
    (file: File) => {
      setError(null);
      setFileName(file.name);

      Papa.parse<RawCSVRow>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_'),
        complete: async (results) => {
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
          const missingCols = REQUIRED_COLS.filter((col) => !(col in firstRow));

          if (missingCols.length > 0) {
            setError(
              `Kolom wajib tidak ditemukan: ${missingCols.join(', ')}. \nFormat yang diharapkan: Kelas, Nama Singkat (Atau Mata Kuliah), Hari, Sesi, Jam, Ruangan, Total Asprak, Dosen`
            );
            return;
          }

          // Build preview rows
          const preview: JadwalPreviewRow[] = [];

          data.forEach((row) => {
            // 1. Resolve MK using logic identical to Excel Import
            const mkName = (row.nama_singkat || row.mata_kuliah || '').trim();
            const kelas = (row.kelas || '').trim();
            const isPJJ = kelas.toUpperCase().includes('PJJ');
            const prodi = kelas.split('-')[0].toUpperCase();

            // Filter candidates by term if available
            const candidates = term
              ? mataKuliahList.filter((mk) => mk.praktikum?.tahun_ajaran === term)
              : mataKuliahList;

            // Helper to find exact MK matching name and prodi
            const findMk = (searchProdi: string) => {
              return candidates.find(
                (mk) =>
                  (mk.praktikum?.nama?.toLowerCase() === mkName.toLowerCase() ||
                    mk.nama_lengkap.toLowerCase() === mkName.toLowerCase()) &&
                  mk.program_studi?.toUpperCase() === searchProdi.toUpperCase()
              );
            };

            let targetMK = findMk(prodi);
            if (!targetMK && isPJJ) targetMK = findMk('IF-PJJ');
            if (!targetMK) targetMK = findMk('IF') || findMk('SE') || findMk('IT') || findMk('DS');

            const mkId = targetMK?.id.toString() || '';

            // 2. Validate Day
            const hari = (row.hari || '').trim().toUpperCase();
            const isValidDay = VALID_DAYS.includes(hari);

            // 3. Parse Numbers
            const sesi = Number(row.sesi || 0);
            const totalAsprak = Number(row.total_asprak || 0);

            const displayMkName = targetMK ? targetMK.nama_lengkap : mkName;

            let status: 'ok' | 'error' | 'warning' = 'ok';
            let statusMessage = '';

            if (!targetMK) {
              status = 'error';
              statusMessage = `Mata Kuliah "${mkName}" tidak ditemukan.`;
            } else if (!isValidDay) {
              status = 'error';
              statusMessage = `Hari "${hari}" tidak valid.`;
            } else if (!isPJJ && sesi <= 0) {
              // Bypass zero session check if it's PJJ (PJJ class validation relaxation)
              status = 'error';
              statusMessage = 'Sesi harus > 0 (Kecuali PJJ)';
            }

            // 4. Cleanup Ruangan
            let ruanganClean = (row.ruangan || '').trim();
            if (ruanganClean.includes('&')) {
              ruanganClean = ruanganClean.split('&')[0].trim();
            }

            preview.push({
              id_mk: mkId,
              kelas: kelas,
              hari: hari,
              sesi: sesi,
              jam: (row.jam || '').trim(),
              ruangan: ruanganClean,
              total_asprak: totalAsprak,
              dosen: (row.dosen || '').trim(),
              // UI props
              mkName: displayMkName,
              fromSystemLogic: !!targetMK,
              status,
              statusMessage,
              selected: status === 'ok',
              originalRow: preview.length + 2, // 1-indexed plus header
            });
          });

          // APPLY VALIDATION
          const validatedRows = await validateConflicts(preview);

          setPreviewRows(validatedRows);
          setStep('preview');
        },
        error: (err: Error) => {
          setError(`Failed to parse CSV: ${err.message}`);
        },
      });
    },
    [mataKuliahList, term]
  );

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    const data = [
      {
        Kelas: 'IF-45-01',
        'Nama Singkat': 'PBO',
        Hari: 'SENIN',
        Sesi: 1,
        Jam: '06:30',
        Ruangan: 'TULT 0612 & 0613',
        'Total Asprak': 2,
        Dosen: 'ABC',
      },
      {
        Kelas: 'SE-45-02',
        'Nama Singkat': 'ALPRO',
        Hari: 'SELASA',
        Sesi: 2,
        Jam: '09:30',
        Ruangan: 'TULT 0615',
        'Total Asprak': 2,
        Dosen: 'DEF',
      },
    ];

    if (format === 'csv') {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_jadwal.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'template_jadwal.xlsx');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => acceptedFiles[0] && processAndValidate(acceptedFiles[0]),
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  });

  const handleToggleSelect = (index: number) => {
    setPreviewRows((prev) => {
      const next = [...prev];
      if (next[index].status !== 'error') {
        next[index].selected = !next[index].selected;
      }
      return next;
    });
  };

  const handleToggleAll = (checked: boolean) => {
    setPreviewRows((prev) =>
      prev.map((r) => (r.status !== 'error' ? { ...r, selected: checked } : r))
    );
  };

  const handleConfirm = async () => {
    const selected = previewRows.filter((r) => r.selected && r.status !== 'error');
    if (selected.length === 0) return;

    setSaving(true);
    try {
      const payload = selected.map((r) => ({
        id_mk: r.id_mk,
        kelas: r.kelas,
        hari: r.hari,
        sesi: r.sesi,
        jam: r.jam,
        ruangan: r.ruangan,
        total_asprak: r.total_asprak,
        dosen: r.dosen,
      }));

      await onImport(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setPreviewRows([]);
    setFileName(null);
    setError(null);
  };

  // ─── Stats for Preview ───────────────────────────────────────────────────
  const totalOk = previewRows.filter((r) => r.status === 'ok').length;
  const totalWarning = previewRows.filter((r) => r.status === 'warning').length;
  const totalError = previewRows.filter((r) => r.status === 'error').length;

  const selectableRows = previewRows.filter((r) => r.status === 'ok' || r.status === 'warning');
  const selectedCount = selectableRows.filter((r) => r.selected).length;
  const allSelected = selectableRows.length > 0 && selectedCount === selectableRows.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < selectableRows.length;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'flex max-h-[min(800px,90vh)] flex-col gap-0 p-0',
          step === 'preview' ? 'sm:max-w-5xl' : 'sm:max-w-lg'
        )}
      >
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4 flex items-center gap-2">
            <Upload size={18} />
            Import CSV Jadwal
            {step === 'preview' && (
              <span className="text-sm font-normal text-muted-foreground ml-2">— Preview</span>
            )}
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

              {step === 'upload' ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium leading-none">Upload CSV</label>
                        {term && (
                          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            Term: {term}
                          </span>
                        )}
                      </div>
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
                        'border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer',
                        isDragActive
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-transparent hover:border-primary/50'
                      )}
                    >
                      <input {...getInputProps()} />
                      <FileSpreadsheet size={40} className="mx-auto mb-3 text-muted-foreground" />
                      {isDragActive ? (
                        <p className="text-primary font-semibold">Drop CSV file di sini...</p>
                      ) : (
                        <>
                          <p className="font-medium">Drag & drop CSV file di sini</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            atau klik untuk pilih file
                          </p>
                        </>
                      )}
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">
                        Format Kolom:
                      </p>
                      <div className="flex flex-wrap gap-2 mb-1">
                        {[
                          'Kelas',
                          'Nama Singkat',
                          'Hari',
                          'Sesi',
                          'Jam',
                          'Ruangan',
                          'Total Asprak',
                          'Dosen',
                        ].map((col) => (
                          <span
                            key={col}
                            className="text-[10px] bg-background border px-1.5 py-0.5 rounded font-mono text-muted-foreground"
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 mb-3">
                        * Nama Singkat (Atau Mata Kuliah) harus sesuai detail praktikum (contoh:
                        "PBO"). Ruangan akan dipotong otomatis jika ada "&".
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
              ) : (
                <div className="space-y-4">
                  {/* Summary Badges using Asprak Preview style */}
                  <div className="flex flex-wrap gap-3 items-center">
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      Total: <span className="font-bold ml-1">{previewRows.length}</span>
                    </Badge>
                    <Badge
                      variant={selectedCount > 0 ? 'default' : 'outline'}
                      className="text-sm px-3 py-1 transition-colors"
                    >
                      Dipilih: <span className="font-bold ml-1">{selectedCount}</span>
                    </Badge>
                    {totalOk > 0 && (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-sm px-3 py-1">
                        <CheckCircle size={14} className="mr-1" />
                        {totalOk} OK
                      </Badge>
                    )}
                    {totalError > 0 && (
                      <Badge className="bg-red-500/10 text-red-500 border-red-500/30 text-sm px-3 py-1">
                        <AlertTriangle size={14} className="mr-1" />
                        {totalError} Error
                      </Badge>
                    )}
                    {totalWarning > 0 && (
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-sm px-3 py-1">
                        <AlertTriangle size={14} className="mr-1" />
                        {totalWarning} Warning
                      </Badge>
                    )}
                  </div>

                  {/* Table Component */}
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-muted/50 sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-2.5 text-center border-b border-border w-[40px]">
                              <Checkbox
                                checked={
                                  allSelected ? true : isIndeterminate ? 'indeterminate' : false
                                }
                                onCheckedChange={(checked) => handleToggleAll(!!checked)}
                                disabled={selectableRows.length === 0}
                              />
                            </th>
                            <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border w-[50px]">
                              No
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                              Mata Kuliah
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                              Kelas
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                              Data Waktu
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                              Ruangan
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                              Dosen
                            </th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((row, idx) => {
                            const isDisabled = row.status === 'error';
                            return (
                              <tr
                                key={idx}
                                className={cn(
                                  'border-b border-border/50 transition-colors hover:bg-muted/60',
                                  row.status === 'error' ? 'bg-red-500/5' : '',
                                  row.status === 'warning' ? 'bg-amber-500/5' : '',
                                  !isDisabled && row.selected ? 'bg-muted/40' : ''
                                )}
                              >
                                <td className="px-3 py-2 text-center">
                                  <Checkbox
                                    checked={row.selected}
                                    onCheckedChange={() => handleToggleSelect(idx)}
                                    disabled={isDisabled}
                                    className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                                  />
                                </td>
                                <td className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">
                                  {row.originalRow}
                                </td>
                                <td className="px-3 py-2 font-medium">
                                  <div className="flex items-center gap-2">
                                    <span>{row.mkName}</span>
                                    {row.fromSystemLogic && (
                                      <Badge
                                        variant="outline"
                                        className="text-[9px] h-4 px-1 py-0 shadow-none border-primary/20 text-primary"
                                      >
                                        Auto-Match
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground/60 font-mono hidden sm:block">
                                    ID: {row.id_mk || '-'}
                                  </div>
                                </td>
                                <td className="px-3 py-2">{row.kelas}</td>
                                <td className="px-3 py-2">
                                  <div>
                                    {row.hari}, {row.jam}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground/60">
                                    Sesi {row.sesi}
                                  </div>
                                </td>
                                <td className="px-3 py-2">{row.ruangan}</td>
                                <td className="px-3 py-2 truncate max-w-[150px]" title={row.dosen}>
                                  {row.dosen}
                                </td>
                                <td className="px-3 py-2">
                                  {row.status === 'ok' && (
                                    <span className="inline-flex items-center gap-1 text-emerald-500 text-xs font-medium">
                                      <CheckCircle size={14} /> OK
                                    </span>
                                  )}
                                  {row.status === 'warning' && (
                                    <span
                                      className="inline-flex items-center gap-1 text-amber-500 text-xs font-medium"
                                      title={row.statusMessage}
                                    >
                                      <AlertTriangle size={14} /> {row.statusMessage}
                                    </span>
                                  )}
                                  {row.status === 'error' && (
                                    <span
                                      className="inline-flex items-center gap-1 text-red-500 text-xs font-medium"
                                      title={row.statusMessage}
                                    >
                                      <AlertTriangle size={14} /> {row.statusMessage}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-2">
                    <Button type="button" variant="outline" onClick={handleReset} disabled={saving}>
                      <ArrowLeft size={16} className="mr-1" />
                      Kembali
                    </Button>

                    <div className="flex items-center gap-3">
                      {totalError > 0 && (
                        <p className="text-xs text-amber-500">
                          {totalError} row(s) bermasalah akan di-skip.
                        </p>
                      )}
                      <Button
                        onClick={handleConfirm}
                        disabled={saving || selectedCount === 0}
                        variant="default"
                      >
                        {saving ? (
                          <Loader2 className="animate-spin mr-2" size={16} />
                        ) : (
                          <Save size={16} className="mr-1" />
                        )}
                        {saving ? 'Menyimpan...' : `Simpan ${selectedCount} Data Terpilih`}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
