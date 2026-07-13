'use client';

import { useCallback, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { useDropzone } from 'react-dropzone';
import { Check, ClipboardList, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { PraktikanRecord } from './types';

type PreviewRow = Omit<PraktikanRecord, 'id' | 'created_at'> & {
  id: string;
  selected: boolean;
  status: 'ok' | 'warning' | 'error';
  note: string;
};

type SheetMatrix = string[][];

function makePraktikanId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');
}

function cell(row: string[], index: number) {
  if (index < 0) return '';
  return String(row[index] ?? '').trim();
}

function findColumn(headers: string[], matchers: string[]) {
  return headers.findIndex((header) => matchers.some((matcher) => header.includes(matcher)));
}

function isHeaderRow(row: string[]) {
  const headers = row.map(normalizeHeader);
  return headers.some((header) =>
    [
      'nama',
      'name',
      'nim',
      'kelas',
      'class',
      'asprak',
      'aspak',
      'kode',
      'kode_asprak',
      'mata_kuliah',
      'matkul',
      'mk',
    ].some((candidate) => header.includes(candidate))
  );
}

function rowsFromMatrix(
  matrix: SheetMatrix,
  defaultKelas: string,
  defaultMataKuliah: string
): PreviewRow[] {
  const cleaned = matrix.reduce((acc: string[][], row) => {
    const trimmedRow = row.map((value) => String(value ?? '').trim());
    if (trimmedRow.some(Boolean)) acc.push(trimmedRow);
    return acc;
  }, []);

  if (cleaned.length === 0) return [];

  const hasHeader = isHeaderRow(cleaned[0]);
  const headers = hasHeader ? cleaned[0].map(normalizeHeader) : [];
  const startIndex = hasHeader ? 1 : 0;

  const namaIndex = hasHeader ? findColumn(headers, ['nama', 'name', 'nim']) : 0;
  const kelasIndex = hasHeader ? findColumn(headers, ['kelas', 'class']) : -1;
  const kodeIndex = hasHeader ? findColumn(headers, ['kode', 'asprak', 'aspak']) : 1;
  const mataKuliahIndex = hasHeader ? findColumn(headers, ['mata_kuliah', 'matkul', 'mk']) : -1;

  let lastKodeAsprak = '';

  return cleaned.slice(startIndex).map((row) => {
    const rawKode = cell(row, kodeIndex).toUpperCase();
    if (rawKode) lastKodeAsprak = rawKode;

    const nama = cell(row, namaIndex).toUpperCase();
    const kelas = (cell(row, kelasIndex) || defaultKelas).toUpperCase();
    const mata_kuliah = (cell(row, mataKuliahIndex) || defaultMataKuliah).toUpperCase();
    const kode_asprak = rawKode || lastKodeAsprak;
    const missing = [
      !nama ? 'nama kosong' : '',
      !kelas ? 'kelas kosong' : '',
      !mata_kuliah ? 'mata_kuliah kosong' : '',
      !kode_asprak ? 'kode_asprak kosong' : '',
    ].filter(Boolean);

    return {
      id: makePraktikanId(),
      nama,
      kelas,
      kode_asprak,
      mata_kuliah,
      selected: missing.length === 0,
      status: missing.length === 0 ? 'ok' : 'warning',
      note: missing.length === 0 ? 'Siap ditambahkan' : missing.join(', '),
    };
  });
}

function parseTextMatrix(value: string): SheetMatrix {
  const result = Papa.parse<string[]>(value, {
    header: false,
    skipEmptyLines: 'greedy',
  });
  return result.data as SheetMatrix;
}

function updatePreviewStatus(row: PreviewRow): PreviewRow {
  const missing = [
    !row.nama.trim() ? 'nama kosong' : '',
    !row.kelas.trim() ? 'kelas kosong' : '',
    !row.mata_kuliah.trim() ? 'mata_kuliah kosong' : '',
    !row.kode_asprak?.trim() ? 'kode_asprak kosong' : '',
  ].filter(Boolean);

  return {
    ...row,
    status: missing.length === 0 ? 'ok' : 'warning',
    selected: missing.length === 0 ? row.selected : false,
    note: missing.length === 0 ? 'Siap ditambahkan' : missing.join(', '),
  };
}

interface PraktikanImportCSVModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (rows: Omit<PraktikanRecord, 'id' | 'created_at'>[]) => Promise<void>;
}

export default function PraktikanImportCSVModal({
  open,
  onClose,
  onImport,
}: PraktikanImportCSVModalProps) {
  const [defaultKelas, setDefaultKelas] = useState('');
  const [defaultMataKuliah, setDefaultMataKuliah] = useState('');
  const [pasteValue, setPasteValue] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedPreviewRows = useMemo(
    () => previewRows.filter((row) => row.selected && row.status !== 'error').length,
    [previewRows]
  );

  const handleClose = () => {
    if (saving) return;
    setPreviewRows([]);
    setPasteValue('');
    setFileName('');
    setDefaultKelas('');
    setDefaultMataKuliah('');
    onClose();
  };

  const applyPreviewRows = useCallback((matrix: SheetMatrix, label: string) => {
    const parsedRows = rowsFromMatrix(matrix, defaultKelas, defaultMataKuliah);
    setPreviewRows(parsedRows);
    toast.success(`${parsedRows.length} baris dari ${label} siap ditinjau.`);
  }, [defaultKelas, defaultMataKuliah]);

  const handlePastePreview = () => {
    if (!pasteValue.trim()) {
      toast.error('Tempel data Excel/CSV terlebih dahulu.');
      return;
    }
    applyPreviewRows(parseTextMatrix(pasteValue), 'paste');
  };

  const parseCsvFile = useCallback((file: File) => {
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: 'greedy',
      complete: (result) => {
        applyPreviewRows(result.data as SheetMatrix, file.name);
        setParsing(false);
      },
      error: (error: Error) => {
        setParsing(false);
        toast.error(`Gagal membaca CSV: ${error.message}`);
      },
    });
  }, [applyPreviewRows]);

  const parseSpreadsheetFile = useCallback(async (file: File) => {
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const matrix = XLSX.utils.sheet_to_json<string[]>(firstSheet, {
        header: 1,
        defval: '',
      }) as SheetMatrix;

      applyPreviewRows(matrix, file.name);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'File tidak bisa dibaca.';
      toast.error(`Gagal membaca Excel: ${message}`);
    } finally {
      setParsing(false);
    }
  }, [applyPreviewRows]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setFileName(file.name);
      setParsing(true);

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'xls') {
        parseSpreadsheetFile(file);
        return;
      }

      parseCsvFile(file);
    },
    [parseSpreadsheetFile, parseCsvFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handlePreviewEdit = (
    id: string | number,
    field: keyof Pick<PreviewRow, 'nama' | 'kelas' | 'mata_kuliah' | 'kode_asprak'>,
    value: string
  ) => {
    setPreviewRows((current) =>
      current.map((row) =>
        row.id === id ? updatePreviewStatus({ ...row, [field]: value.toUpperCase() }) : row
      )
    );
  };

  const handleTogglePreview = (id: string | number) => {
    setPreviewRows((current) =>
      current.map((row) =>
        row.id === id && row.status !== 'error' ? { ...row, selected: !row.selected } : row
      )
    );
  };

  const handleAddPreviewRows = async () => {
    const selected = previewRows.filter((row) => row.selected && row.status !== 'error');
    if (selected.length === 0) {
      toast.error('Pilih minimal satu baris preview.');
      return;
    }

    setSaving(true);
    try {
      await onImport(
        selected.map((row) => ({
          nama: row.nama,
          kelas: row.kelas,
          mata_kuliah: row.mata_kuliah,
          kode_asprak: row.kode_asprak,
        }))
      );
      handleClose();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan data praktikan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[min(900px,95vh)] flex-col gap-0 p-0 sm:max-w-[95vw] xl:max-w-[1400px]">
        <DialogHeader className="contents space-y-0 text-left">
          <div className="border-b px-6 py-4">
            <DialogTitle>Import Data Praktikan</DialogTitle>
            <DialogDescription className="mt-1">
              Import banyak baris dari Excel/CSV, lalu validasi di preview sebelum masuk database.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 xl:grid-cols-[420px_1fr] bg-muted/10">
          {/* Left Panel: Inputs */}
          <div className="flex flex-col gap-6 p-6 overflow-y-auto border-b xl:border-b-0 xl:border-r">
            <div className="space-y-4 rounded-xl border bg-background shadow-sm p-4 shrink-0">
              <div className="space-y-2">
                <label htmlFor="default-kelas" className="text-sm font-medium">Kelas Default</label>
                <Input
                  id="default-kelas"
                  value={defaultKelas}
                  onChange={(event) => setDefaultKelas(event.target.value)}
                  placeholder="Dipakai untuk format tanpa kolom kelas"
                  className="h-10 bg-background"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="default-mata-kuliah" className="text-sm font-medium">Mata Kuliah Default</label>
                <Input
                  id="default-mata-kuliah"
                  value={defaultMataKuliah}
                  onChange={(event) => setDefaultMataKuliah(event.target.value)}
                  placeholder="Dipakai jika kolom matkul tidak ada"
                  className="h-10 bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format dua kolom memakai nilai default ini. Kode kosong diisi dari kode asprak sebelumnya.
                </p>
              </div>
            </div>

            <div className="space-y-2 shrink-0">
              <label htmlFor="paste-data" className="text-sm font-medium">Paste dari Excel / CSV</label>
              <textarea
                id="paste-data"
                value={pasteValue}
                onChange={(event) => setPasteValue(event.target.value)}
                placeholder={'Nama\tKode Asprak\nAQIL MUJAHID\tRGG\nRAJA ASYRAF\t'}
                className="min-h-[160px] w-full resize-y rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20"
              />
            </div>

            <div className="space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <label htmlFor="praktikan-file-upload" className="text-sm font-medium leading-none">Upload CSV / Excel</label>
                {fileName && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText size={12} />
                    {fileName}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3 items-stretch">
                <div
                  {...getRootProps()}
                  className={cn(
                    'border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all',
                    isDragActive
                      ? 'border-primary bg-primary/5 cursor-copy'
                      : 'border-border bg-transparent hover:border-primary/50 cursor-pointer'
                  )}
                >
                  <input {...getInputProps({ id: 'praktikan-file-upload' })} />
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet size={32} className="text-primary/70" />
                    <p className="text-sm font-medium">
                      {isDragActive ? 'Lepaskan file di sini...' : 'Tarik file ke sini'}
                    </p>
                    <p className="text-xs text-muted-foreground">klik untuk memilih dari komputer</p>
                  </div>
                </div>

                <Button variant="outline" onClick={handlePastePreview} className="h-auto flex-col justify-center gap-1 py-3 px-6 shrink-0">
                  <FileSpreadsheet size={20} />
                  <span className="text-sm font-medium">Preview Paste</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel: Preview Table */}
          <div className="flex flex-col p-6 overflow-hidden h-full">
            <div className="rounded-2xl border bg-background shadow-sm overflow-hidden flex flex-col h-full">
              <div className="flex flex-col gap-3 border-b bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between shrink-0">
                <div>
                  <h2 className="font-semibold">Preview Import</h2>
                  <p className="text-sm text-muted-foreground">
                    Edit, pilih, dan validasi baris sebelum dikirim ke database.
                  </p>
                </div>
                <Button
                  onClick={handleAddPreviewRows}
                  disabled={parsing || saving || selectedPreviewRows === 0}
                  className="w-full lg:w-auto"
                >
                  <Check size={16} className="mr-2" />
                  {saving ? 'Menyimpan...' : `Tambahkan ${selectedPreviewRows || ''}`}
                </Button>
              </div>
              
              <div className="flex-1 overflow-auto p-0 relative">
                {previewRows.length === 0 ? (
                  <div className="flex min-h-[250px] h-full flex-col items-center justify-center text-center p-8">
                    <ClipboardList className="mb-3 text-muted-foreground" size={38} />
                    <p className="font-medium text-foreground">{parsing ? 'Membaca file...' : 'Belum ada preview'}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Paste data atau upload CSV/Excel untuk mulai validasi.
                    </p>
                  </div>
                ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-md">
                    <TableRow>
                      <TableHead className="w-12 text-center">Pilih</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Mata Kuliah</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={row.selected}
                            disabled={row.status === 'error'}
                            onCheckedChange={() => handleTogglePreview(row.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.nama}
                            onChange={(event) => handlePreviewEdit(row.id, 'nama', event.target.value)}
                            className="min-w-56 h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.kelas}
                            onChange={(event) => handlePreviewEdit(row.id, 'kelas', event.target.value)}
                            className="min-w-24 h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.mata_kuliah}
                            onChange={(event) =>
                              handlePreviewEdit(row.id, 'mata_kuliah', event.target.value)
                            }
                            className="min-w-24 h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.kode_asprak ?? ''}
                            onChange={(event) =>
                              handlePreviewEdit(row.id, 'kode_asprak', event.target.value)
                            }
                            className="min-w-20 h-8 text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={row.status === 'ok' ? 'secondary' : 'outline'}
                            className={cn(
                              row.status === 'ok' && 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 hover:bg-blue-500/20 border-transparent',
                              row.status !== 'ok' && 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/50'
                            )}
                          >
                            {row.note}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
