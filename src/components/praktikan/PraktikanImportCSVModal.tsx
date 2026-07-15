'use client';

import { useCallback, useMemo, useState, memo } from 'react';
import Papa from 'papaparse';
import { useDropzone } from 'react-dropzone';
import { FileSpreadsheet, FileText, Download, Save } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
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

const PreviewTableRow = memo(({ 
  row, 
  onToggle, 
  onEdit 
}: { 
  row: PreviewRow;
  onToggle: (id: string | number) => void;
  onEdit: (id: string | number, field: keyof Pick<PreviewRow, 'nama' | 'kelas' | 'mata_kuliah' | 'kode_asprak'>, value: string) => void;
}) => {
  return (
    <TableRow>
      <TableCell className="text-center">
        <Checkbox
          checked={row.selected}
          disabled={row.status === 'error'}
          onCheckedChange={() => onToggle(row.id)}
        />
      </TableCell>
      <TableCell>
        <Input
          value={row.nama}
          onChange={(event) => onEdit(row.id, 'nama', event.target.value)}
          className="min-w-56 h-8 text-sm"
        />
      </TableCell>
      <TableCell>
        <Input
          value={row.kelas}
          onChange={(event) => onEdit(row.id, 'kelas', event.target.value)}
          className="min-w-24 h-8 text-sm"
        />
      </TableCell>
      <TableCell>
        <Input
          value={row.mata_kuliah}
          onChange={(event) => onEdit(row.id, 'mata_kuliah', event.target.value)}
          className="min-w-24 h-8 text-sm"
        />
      </TableCell>
      <TableCell>
        <Input
          value={row.kode_asprak ?? ''}
          onChange={(event) => onEdit(row.id, 'kode_asprak', event.target.value)}
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
  );
});
PreviewTableRow.displayName = 'PreviewTableRow';

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
  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    const data = [
      { nama: 'Budi Santoso', nim: '1301213001', kelas: 'IF-45-01', mata_kuliah: 'JARKOM', kode_asprak: 'BUS' },
      { nama: 'Siti Aminah', nim: '1301213002', kelas: 'IF-45-01', mata_kuliah: 'JARKOM', kode_asprak: 'BUS' },
    ];

    if (format === 'csv') {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_praktikan.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'xlsx') {
      try {
        const XLSX = await import('xlsx');
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'template_praktikan.xlsx');
      } catch {
        toast.error('Gagal membuat file XLSX');
      }
    }
  };
  const [defaultKelas, setDefaultKelas] = useState('');
  const [defaultMataKuliah, setDefaultMataKuliah] = useState('');
  const [pasteValue, setPasteValue] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

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
    setCurrentPage(1);
    onClose();
  };

  const applyPreviewRows = useCallback((matrix: SheetMatrix, label: string) => {
    const parsedRows = rowsFromMatrix(matrix, defaultKelas, defaultMataKuliah);
    setPreviewRows(parsedRows);
    setCurrentPage(1);
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

  const handlePreviewEdit = useCallback((
    id: string | number,
    field: keyof Pick<PreviewRow, 'nama' | 'kelas' | 'mata_kuliah' | 'kode_asprak'>,
    value: string
  ) => {
    setPreviewRows((current) =>
      current.map((row) =>
        row.id === id ? updatePreviewStatus({ ...row, [field]: value.toUpperCase() }) : row
      )
    );
  }, []);

  const handleTogglePreview = useCallback((id: string | number) => {
    setPreviewRows((current) =>
      current.map((row) =>
        row.id === id && row.status !== 'error' ? { ...row, selected: !row.selected } : row
      )
    );
  }, []);

  const totalPages = Math.ceil(previewRows.length / itemsPerPage) || 1;
  const currentRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return previewRows.slice(start, start + itemsPerPage);
  }, [previewRows, currentPage, itemsPerPage]);

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
              <Button variant="outline" onClick={handlePastePreview} className="w-full mt-2 h-auto flex gap-2 justify-center py-2 shrink-0">
                <FileSpreadsheet size={16} />
                <span className="text-sm font-medium">Preview Paste</span>
              </Button>
            </div>

            <div className="space-y-2 shrink-0">
              <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-2 font-medium">
                  Format Kolom:
                </p>
                <div className="flex flex-wrap gap-2 mb-1">
                  {[
                    'nama',
                    'nim',
                    'kelas',
                    'mata_kuliah',
                    'kode_asprak',
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
                  * Kolom tidak harus berurutan, namun header (baris pertama) harus sesuai format.
                </p>

                <div className="flex items-center gap-3 pt-3 mt-1 border-t border-border/50">
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
                <Button onClick={handleAddPreviewRows} disabled={saving || !selectedPreviewRows} className="w-full lg:w-auto">
                  {saving ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Tambahkan {selectedPreviewRows || ''}
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex-1 overflow-auto p-0 relative h-full">
                {previewRows.length === 0 ? (
                  <div 
                    {...getRootProps()}
                    className={cn(
                      "flex min-h-[250px] h-full flex-col items-center justify-center text-center p-8 transition-all duration-200 border-2 border-dashed m-4 rounded-xl",
                      isDragActive 
                        ? 'border-primary bg-primary/5 cursor-copy'
                        : 'border-transparent bg-transparent hover:border-border hover:bg-muted/10 cursor-pointer'
                    )}
                  >
                    <input {...getInputProps({ id: 'praktikan-file-upload' })} />
                    <FileSpreadsheet 
                      size={48} 
                      className={cn(
                        "mb-4 transition-colors",
                        isDragActive ? "text-primary" : "text-muted-foreground/60"
                      )} 
                    />
                    <p className="font-medium text-foreground text-lg mb-1">
                      {parsing ? 'Membaca file...' : isDragActive ? 'Lepaskan file di sini...' : 'Tarik & lepas file CSV / Excel di sini'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      atau klik area ini untuk memilih file
                    </p>
                    {fileName && (
                      <span className="text-xs font-mono text-muted-foreground mt-4 bg-muted px-2 py-1 rounded">
                        File terakhir: {fileName}
                      </span>
                    )}
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
                    {currentRows.map((row) => (
                      <PreviewTableRow 
                        key={row.id} 
                        row={row} 
                        onToggle={handleTogglePreview} 
                        onEdit={handlePreviewEdit} 
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            
            {/* Pagination Controls */}
            {previewRows.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10 shrink-0">
                <div className="text-sm text-muted-foreground">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, previewRows.length)} dari {previewRows.length} baris
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
