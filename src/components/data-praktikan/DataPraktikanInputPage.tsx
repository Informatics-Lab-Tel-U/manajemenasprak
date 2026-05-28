'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { Check, FileSpreadsheet, Plus, Save, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
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
import { appendPraktikanRows, makePraktikanId, type PraktikanRow } from './storage';

type PreviewRow = PraktikanRow & {
  selected: boolean;
  status: 'ok' | 'warning' | 'error';
  note: string;
};

type SheetMatrix = string[][];
type InputMode = 'manual' | 'import';

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
    ['nama', 'name', 'nim', 'kelas', 'class', 'asprak', 'aspak', 'kode', 'kode_asprak'].some(
      (candidate) => header.includes(candidate)
    )
  );
}

function rowsFromMatrix(matrix: SheetMatrix, defaultKelas: string): PreviewRow[] {
  const cleaned = matrix
    .map((row) => row.map((value) => String(value ?? '').trim()))
    .filter((row) => row.some(Boolean));

  if (cleaned.length === 0) return [];

  const hasHeader = isHeaderRow(cleaned[0]);
  const headers = hasHeader ? cleaned[0].map(normalizeHeader) : [];
  const startIndex = hasHeader ? 1 : 0;

  const namaIndex = hasHeader ? findColumn(headers, ['nama', 'name', 'nim']) : 0;
  const kelasIndex = hasHeader ? findColumn(headers, ['kelas', 'class']) : -1;
  const kodeIndex = hasHeader ? findColumn(headers, ['kode', 'asprak', 'aspak']) : 1;

  let lastKodeAsprak = '';

  return cleaned.slice(startIndex).map((row) => {
    const rawKode = cell(row, kodeIndex).toUpperCase();
    if (rawKode) lastKodeAsprak = rawKode;

    const nama = cell(row, namaIndex).toUpperCase();
    const kelas = (cell(row, kelasIndex) || defaultKelas).toUpperCase();
    const kode_asprak = rawKode || lastKodeAsprak;
    const missing = [
      !nama ? 'nama kosong' : '',
      !kelas ? 'kelas kosong' : '',
      !kode_asprak ? 'kode_asprak kosong' : '',
    ].filter(Boolean);

    return {
      id: makePraktikanId(),
      nama,
      kelas,
      kode_asprak,
      source: 'import',
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
    !row.kode_asprak.trim() ? 'kode_asprak kosong' : '',
  ].filter(Boolean);

  return {
    ...row,
    status: missing.length === 0 ? 'ok' : 'warning',
    selected: missing.length === 0 ? row.selected : false,
    note: missing.length === 0 ? 'Siap ditambahkan' : missing.join(', '),
  };
}

export default function DataPraktikanInputPage() {
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [manualNama, setManualNama] = useState('');
  const [manualKelas, setManualKelas] = useState('');
  const [manualKodeAsprak, setManualKodeAsprak] = useState('');
  const [defaultKelas, setDefaultKelas] = useState('');
  const [pasteValue, setPasteValue] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [parsing, setParsing] = useState(false);

  const selectedPreviewRows = useMemo(
    () => previewRows.filter((row) => row.selected && row.status !== 'error').length,
    [previewRows]
  );

  const handleManualSubmit = () => {
    const nama = manualNama.trim().toUpperCase();
    const kelas = manualKelas.trim().toUpperCase();
    const kode_asprak = manualKodeAsprak.trim().toUpperCase();

    if (!nama || !kelas || !kode_asprak) {
      toast.error('Nama, kelas, dan kode asprak wajib diisi.');
      return;
    }

    appendPraktikanRows([{ id: makePraktikanId(), nama, kelas, kode_asprak, source: 'manual' }]);
    setManualNama('');
    setManualKelas('');
    setManualKodeAsprak('');
    toast.success('Data praktikan ditambahkan.');
  };

  const applyPreviewRows = (matrix: SheetMatrix, label: string) => {
    const parsedRows = rowsFromMatrix(matrix, defaultKelas);
    setPreviewRows(parsedRows);
    toast.success(`${parsedRows.length} baris dari ${label} siap ditinjau.`);
  };

  const handlePastePreview = () => {
    if (!pasteValue.trim()) {
      toast.error('Tempel data Excel/CSV terlebih dahulu.');
      return;
    }

    applyPreviewRows(parseTextMatrix(pasteValue), 'paste');
  };

  const parseCsvFile = (file: File) => {
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
  };

  const parseSpreadsheetFile = async (file: File) => {
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
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setFileName(file.name);
    setParsing(true);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      parseSpreadsheetFile(file);
      return;
    }

    parseCsvFile(file);
  };

  const handlePreviewEdit = (
    id: string,
    field: keyof Pick<PreviewRow, 'nama' | 'kelas' | 'kode_asprak'>,
    value: string
  ) => {
    setPreviewRows((current) =>
      current.map((row) =>
        row.id === id ? updatePreviewStatus({ ...row, [field]: value.toUpperCase() }) : row
      )
    );
  };

  const handleTogglePreview = (id: string) => {
    setPreviewRows((current) =>
      current.map((row) =>
        row.id === id && row.status !== 'error' ? { ...row, selected: !row.selected } : row
      )
    );
  };

  const handleAddPreviewRows = () => {
    const selected = previewRows.filter((row) => row.selected && row.status !== 'error');
    if (selected.length === 0) {
      toast.error('Pilih minimal satu baris preview.');
      return;
    }

    appendPraktikanRows(
      selected.map(({ selected: _selected, status: _status, note: _note, ...row }) => row)
    );
    setPreviewRows([]);
    setPasteValue('');
    setFileName('');
    toast.success(`${selected.length} data praktikan ditambahkan.`);
  };

  return (
    <div className="container space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Input Data Praktikan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Input manual, upload file, atau paste data dari Excel/CSV. Data belum menyentuh
            database.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/data-praktikan/view">Lihat Data</Link>
        </Button>
      </header>

      <section className="rounded-lg border bg-background p-5">
        <div className="mb-5 grid gap-4 md:grid-cols-[minmax(260px,360px)_1fr] md:items-start">
          <div className="relative grid h-11 grid-cols-2 rounded-md border border-sky-200 bg-sky-50/60 p-1 dark:border-sky-900/60 dark:bg-sky-950/30">
            <div
              className={cn(
                'absolute bottom-1 top-1 w-[calc(50%-0.25rem)] rounded-sm bg-sky-600 shadow-sm transition-transform duration-200',
                inputMode === 'import' && 'translate-x-full'
              )}
            />
            <button
              type="button"
              onClick={() => setInputMode('manual')}
              className={cn(
                'relative z-10 inline-flex items-center justify-center gap-2 rounded-sm px-3 text-sm font-medium transition-colors',
                inputMode === 'manual'
                  ? 'text-white'
                  : 'text-sky-800 hover:text-sky-950 dark:text-sky-200'
              )}
            >
              <Plus size={16} />
              Individual
            </button>
            <button
              type="button"
              onClick={() => setInputMode('import')}
              className={cn(
                'relative z-10 inline-flex items-center justify-center gap-2 rounded-sm px-3 text-sm font-medium transition-colors',
                inputMode === 'import'
                  ? 'text-white'
                  : 'text-sky-800 hover:text-sky-950 dark:text-sky-200'
              )}
            >
              <Upload size={16} />
              Import
            </button>
          </div>
          <div>
            <h2 className="font-semibold">
              {inputMode === 'manual' ? 'Input Individual' : 'Import Otomatis'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {inputMode === 'manual'
                ? 'Tambahkan satu praktikan dengan nama, kelas, dan kode asprak.'
                : 'Paste data dari Excel/CSV atau upload file, lalu tinjau sebelum ditambahkan.'}
            </p>
          </div>
        </div>

        {inputMode === 'manual' ? (
          <FieldGroup className="grid gap-4 md:grid-cols-3">
            <Field>
              <FieldLabel>Nama</FieldLabel>
              <Input
                value={manualNama}
                onChange={(event) => setManualNama(event.target.value)}
                placeholder="Nama praktikan"
              />
            </Field>
            <Field>
              <FieldLabel>Kelas</FieldLabel>
              <Input
                value={manualKelas}
                onChange={(event) => setManualKelas(event.target.value)}
                placeholder="IF-GABREM"
              />
            </Field>
            <Field>
              <FieldLabel>Kode Asprak</FieldLabel>
              <Input
                value={manualKodeAsprak}
                onChange={(event) => setManualKodeAsprak(event.target.value)}
                placeholder="AFF"
              />
            </Field>
            <Button onClick={handleManualSubmit} className="md:col-span-3 md:w-fit">
              <Save size={16} />
              Tambahkan
            </Button>
          </FieldGroup>
        ) : (
          <FieldGroup className="gap-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(220px,320px)_1fr]">
              <Field>
                <FieldLabel>Kelas Default</FieldLabel>
                <Input
                  value={defaultKelas}
                  onChange={(event) => setDefaultKelas(event.target.value)}
                  placeholder="Dipakai untuk format tanpa kolom kelas"
                />
                <FieldDescription>
                  Format dua kolom akan memakai kelas default ini. Kode kosong diisi dari kode
                  asprak sebelumnya.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Paste dari Excel / CSV</FieldLabel>
                <textarea
                  value={pasteValue}
                  onChange={(event) => setPasteValue(event.target.value)}
                  placeholder={'Nama\tKode Asprak\nAQIL MUJAHID\tRGG\nRAJA ASYRAF\t'}
                  className="min-h-36 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                <FieldDescription>
                  Sistem mendeteksi header `NIM/Kelas/ASPRAK` atau format dua kolom secara otomatis.
                </FieldDescription>
              </Field>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <Button variant="outline" onClick={handlePastePreview}>
                <FileSpreadsheet size={16} />
                Preview Paste
              </Button>
              <Field className="md:max-w-sm">
                <FieldLabel>Upload File</FieldLabel>
                <Input accept=".csv,.xlsx,.xls" type="file" onChange={handleFileChange} />
                {fileName && (
                  <FieldDescription>
                    File aktif: <span className="font-medium text-foreground">{fileName}</span>
                  </FieldDescription>
                )}
              </Field>
            </div>
          </FieldGroup>
        )}
      </section>

      <section>
        <div className="min-w-0 rounded-lg border bg-background">
          <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold">Preview Import</h2>
              <p className="text-sm text-muted-foreground">
                Edit baris sebelum ditambahkan ke daftar lokal.
              </p>
            </div>
            <Button
              onClick={handleAddPreviewRows}
              disabled={parsing || selectedPreviewRows === 0}
              className="w-full md:w-auto"
            >
              <Check size={16} />
              Tambahkan {selectedPreviewRows || ''}
            </Button>
          </div>
          <div className="max-h-[640px] overflow-auto p-4">
            {previewRows.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-md border border-dashed text-center">
                <FileSpreadsheet className="mb-3 text-muted-foreground" size={36} />
                <p className="font-medium">{parsing ? 'Membaca file...' : 'Belum ada preview'}</p>
                <p className="text-sm text-muted-foreground">
                  Paste data atau upload CSV/Excel untuk mulai validasi.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Pilih</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={row.selected}
                          disabled={row.status === 'error'}
                          onChange={() => handleTogglePreview(row.id)}
                          className="size-4"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.nama}
                          onChange={(event) =>
                            handlePreviewEdit(row.id, 'nama', event.target.value)
                          }
                          className="min-w-56"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.kelas}
                          onChange={(event) =>
                            handlePreviewEdit(row.id, 'kelas', event.target.value)
                          }
                          className="min-w-32"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.kode_asprak}
                          onChange={(event) =>
                            handlePreviewEdit(row.id, 'kode_asprak', event.target.value)
                          }
                          className="min-w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={row.status === 'ok' ? 'secondary' : 'outline'}
                          className={cn(row.status !== 'ok' && 'border-amber-500 text-amber-600')}
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
      </section>
    </div>
  );
}
