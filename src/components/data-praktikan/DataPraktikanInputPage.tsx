'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { Check, ClipboardList, FileSpreadsheet, Plus, Save, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { makePraktikanId, type PraktikanRow } from './storage';

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

export default function DataPraktikanInputPage() {
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [manualNama, setManualNama] = useState('');
  const [manualKelas, setManualKelas] = useState('');
  const [manualMataKuliah, setManualMataKuliah] = useState('');
  const [manualKodeAsprak, setManualKodeAsprak] = useState('');
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

  const handleManualSubmit = async () => {
    const nama = manualNama.trim().toUpperCase();
    const kelas = manualKelas.trim().toUpperCase();
    const mata_kuliah = manualMataKuliah.trim().toUpperCase();
    const kode_asprak = manualKodeAsprak.trim().toUpperCase();

    if (!nama || !kelas || !mata_kuliah || !kode_asprak) {
      toast.error('Nama, kelas, mata kuliah, dan kode asprak wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/praktikan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { nama, kelas, mata_kuliah, kode_asprak } }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Gagal menyimpan data praktikan.');
      }

      setManualNama('');
      setManualKelas('');
      setManualMataKuliah('');
      setManualKodeAsprak('');
      toast.success('Data praktikan ditambahkan ke database.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan data praktikan.');
    } finally {
      setSaving(false);
    }
  };

  const applyPreviewRows = (matrix: SheetMatrix, label: string) => {
    const parsedRows = rowsFromMatrix(matrix, defaultKelas, defaultMataKuliah);
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
      const response = await fetch('/api/praktikan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: selected.map((row) => ({
            nama: row.nama,
            kelas: row.kelas,
            mata_kuliah: row.mata_kuliah,
            kode_asprak: row.kode_asprak,
          })),
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Gagal menyimpan data praktikan.');
      }

      setPreviewRows([]);
      setPasteValue('');
      setFileName('');
      toast.success(`${result.data?.inserted ?? selected.length} data praktikan disimpan.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan data praktikan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container space-y-8">
      <header className="overflow-hidden rounded-2xl border bg-[linear-gradient(135deg,hsl(var(--background)),rgba(16,185,129,0.10))] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge className="mb-3 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
              Data Praktikan
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight">Input Data Praktikan</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Tambahkan data satu per satu atau import banyak baris dari Excel/CSV, lalu validasi di
              preview sebelum masuk database.
            </p>
          </div>
          <Button asChild variant="outline" className="bg-background/80">
            <Link href="/data-praktikan/view">Lihat Data</Link>
          </Button>
        </div>
      </header>

      <section className="rounded-md border bg-background shadow-sm">
        <div className="border-b p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(280px,420px)_1fr] lg:items-center">
            <div className="relative grid h-12 grid-cols-2 rounded-full border border-emerald-200 bg-emerald-50/70 p-1 dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <div
                className={cn(
                  'absolute inset-y-1 left-1 w-[calc(50%-0.5rem)] rounded-full bg-emerald-600 shadow-sm transition-transform duration-200 ease-out',
                  inputMode === 'import' && 'translate-x-[calc(100%+0.5rem)]'
                )}
              />
              <button
                type="button"
                onClick={() => setInputMode('manual')}
                className={cn(
                  'relative z-10 inline-flex items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors',
                  inputMode === 'manual'
                    ? 'text-white'
                    : 'text-emerald-900 hover:text-emerald-950 dark:text-emerald-200'
                )}
              >
                <Plus size={16} />
                Individual
              </button>
              <button
                type="button"
                onClick={() => setInputMode('import')}
                className={cn(
                  'relative z-10 inline-flex items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors',
                  inputMode === 'import'
                    ? 'text-white'
                    : 'text-emerald-900 hover:text-emerald-950 dark:text-emerald-200'
                )}
              >
                <Upload size={16} />
                Import
              </button>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">
                {inputMode === 'manual' ? 'Input individual' : 'Import otomatis'}
              </h2>
            </div>
          </div>
        </div>

        <div className="p-5">
          {inputMode === 'manual' ? (
            <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field>
                <FieldLabel>Nama</FieldLabel>
                <Input
                  value={manualNama}
                  onChange={(event) => setManualNama(event.target.value)}
                  placeholder="Nama praktikan"
                  className="h-11"
                />
              </Field>
              <Field>
                <FieldLabel>Kelas</FieldLabel>
                <Input
                  value={manualKelas}
                  onChange={(event) => setManualKelas(event.target.value)}
                  placeholder="IF-GABREM"
                  className="h-11"
                />
              </Field>
              <Field>
                <FieldLabel>Mata Kuliah</FieldLabel>
                <Input
                  value={manualMataKuliah}
                  onChange={(event) => setManualMataKuliah(event.target.value)}
                  placeholder="ALPRO"
                  className="h-11"
                />
              </Field>
              <Field>
                <FieldLabel>Kode Asprak</FieldLabel>
                <Input
                  value={manualKodeAsprak}
                  onChange={(event) => setManualKodeAsprak(event.target.value)}
                  placeholder="AFF"
                  className="h-11"
                />
              </Field>
              <Button
                onClick={handleManualSubmit}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 md:col-span-2 xl:col-span-4 xl:w-fit"
              >
                <Save size={16} />
                {saving ? 'Menyimpan...' : 'Tambahkan'}
              </Button>
            </FieldGroup>
          ) : (
            <FieldGroup className="gap-5">
              <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
                <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                  <Field>
                    <FieldLabel>Kelas Default</FieldLabel>
                    <Input
                      value={defaultKelas}
                      onChange={(event) => setDefaultKelas(event.target.value)}
                      placeholder="Dipakai untuk format tanpa kolom kelas"
                      className="h-11 bg-background"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Mata Kuliah Default</FieldLabel>
                    <Input
                      value={defaultMataKuliah}
                      onChange={(event) => setDefaultMataKuliah(event.target.value)}
                      placeholder="Dipakai jika kolom mata kuliah tidak ada"
                      className="h-11 bg-background"
                    />
                    <FieldDescription>
                      Format dua kolom memakai nilai default ini. Kode kosong diisi dari kode asprak
                      sebelumnya.
                    </FieldDescription>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Paste dari Excel / CSV</FieldLabel>
                  <textarea
                    value={pasteValue}
                    onChange={(event) => setPasteValue(event.target.value)}
                    placeholder={'Nama\tKode Asprak\nAQIL MUJAHID\tRGG\nRAJA ASYRAF\t'}
                    className="min-h-48 w-full resize-y rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-emerald-500 focus-visible:ring-[3px] focus-visible:ring-emerald-500/20"
                  />
                  <FieldDescription>
                    Header `NIM/Kelas/ASPRAK` dan format dua kolom dideteksi otomatis.
                  </FieldDescription>
                </Field>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <label
                  htmlFor="praktikan-file-upload"
                  className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-5 transition hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-900/70 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30"
                >
                  <input
                    id="praktikan-file-upload"
                    accept=".csv,.xlsx,.xls"
                    type="file"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  <span className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-emerald-600 text-white shadow-sm transition group-hover:scale-105">
                      <Upload size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">Upload CSV atau Excel</span>
                      <span className="block text-sm text-muted-foreground">
                        Klik area ini untuk memilih file `.csv`, `.xlsx`, atau `.xls`.
                      </span>
                    </span>
                  </span>
                  {fileName && (
                    <span className="w-fit rounded-full bg-background px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm dark:text-emerald-300">
                      File aktif: {fileName}
                    </span>
                  )}
                </label>

                <Button variant="outline" onClick={handlePastePreview} className="h-11">
                  <FileSpreadsheet size={16} />
                  Preview Paste
                </Button>
              </div>
            </FieldGroup>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="flex flex-col gap-3 border-b bg-muted/20 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">Preview Import</h2>
            <p className="text-sm text-muted-foreground">
              Edit, pilih, dan validasi baris sebelum dikirim ke database.
            </p>
          </div>
          <Button
            onClick={handleAddPreviewRows}
            disabled={parsing || saving || selectedPreviewRows === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 md:w-auto"
          >
            <Check size={16} />
            {saving ? 'Menyimpan...' : `Tambahkan ${selectedPreviewRows || ''}`}
          </Button>
        </div>
        <div className="max-h-[640px] overflow-auto p-5">
          {previewRows.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 text-center">
              <ClipboardList className="mb-3 text-emerald-600" size={38} />
              <p className="font-medium">{parsing ? 'Membaca file...' : 'Belum ada preview'}</p>
              <p className="text-sm text-muted-foreground">
                Paste data atau upload CSV/Excel untuk mulai validasi.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow>
                  <TableHead className="w-12">Pilih</TableHead>
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
                    <TableCell>
                      <Checkbox
                        checked={row.selected}
                        disabled={row.status === 'error'}
                        onCheckedChange={() => handleTogglePreview(row.id)}
                        className="data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.nama}
                        onChange={(event) => handlePreviewEdit(row.id, 'nama', event.target.value)}
                        className="min-w-56"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.kelas}
                        onChange={(event) => handlePreviewEdit(row.id, 'kelas', event.target.value)}
                        className="min-w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.mata_kuliah}
                        onChange={(event) =>
                          handlePreviewEdit(row.id, 'mata_kuliah', event.target.value)
                        }
                        className="min-w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.kode_asprak ?? ''}
                        onChange={(event) =>
                          handlePreviewEdit(row.id, 'kode_asprak', event.target.value)
                        }
                        className="min-w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={row.status === 'ok' ? 'secondary' : 'outline'}
                        className={cn(
                          row.status === 'ok' &&
                            'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
                          row.status !== 'ok' && 'border-amber-500 text-amber-600'
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
      </section>
    </div>
  );
}
