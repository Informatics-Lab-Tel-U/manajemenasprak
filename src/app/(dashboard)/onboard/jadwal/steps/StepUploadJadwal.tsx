'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileSpreadsheet, Upload, FileText, X, Download, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { MataKuliah } from '@/types/database';
import { useJadwalOnboardStore } from '@/store/useJadwalOnboardStore';
import {
  validateJadwalConflicts,
  buildJadwalPreviewRows,
} from '@/utils/validation/jadwalValidation';

interface RawCSVRow {
  kelas?: string;
  nama_singkat?: string;
  hari?: string;
  sesi?: string | number;
  jam?: string;
  ruangan?: string;
  total_asprak?: string | number;
  dosen?: string;
  mata_kuliah?: string;
}

const REQUIRED_COLS = ['kelas', 'hari', 'sesi', 'jam', 'ruangan'];

interface StepUploadJadwalProps {
  term: string;
  mataKuliahList: MataKuliah[];
}

export default function StepUploadJadwal({ term, mataKuliahList }: StepUploadJadwalProps) {
  const { setJadwalRows, setCurrentStep } = useJadwalOnboardStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const processAndValidate = useCallback(
    async (file: File) => {
      setError(null);
      setFileName(file.name);
      setIsLoading(true);

      try {
        // Dynamic import for PapaParse to reduce initial bundle size
        const Papa = (await import('papaparse')).default;

        Papa.parse<RawCSVRow>(file, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_'),
          complete: async (results) => {
            const { data, errors } = results;

            if (errors.length > 0) {
              setError(`CSV parsing error: ${errors[0].message}`);
              setIsLoading(false);
              return;
            }

            if (data.length === 0) {
              setError('CSV kosong — tidak ada data yang ditemukan.');
              setIsLoading(false);
              return;
            }

            // Validate required columns
            const firstRow = data[0];
            const missingCols = REQUIRED_COLS.filter((col) => !(col in firstRow));

            if (missingCols.length > 0) {
              setError(
                `Kolom wajib tidak ditemukan: ${missingCols.join(', ')}. \nFormat yang diharapkan: Kelas, Nama Singkat (Atau Mata Kuliah), Hari, Sesi, Jam, Ruangan, Total Asprak, Dosen`
              );
              setIsLoading(false);
              return;
            }

            try {
              const preview = buildJadwalPreviewRows(data, mataKuliahList, term);
              const validatedRows = await validateJadwalConflicts(preview, term || '');

              setJadwalRows(validatedRows);
              setCurrentStep('preview');
            } catch (err: any) {
              setError(`Validasi gagal: ${err.message}`);
            } finally {
              setIsLoading(false);
            }
          },
          error: (err: Error) => {
            setError(`Failed to parse CSV: ${err.message}`);
            setIsLoading(false);
          },
        });
      } catch (err: any) {
        setError(`Failed to load PapaParse: ${err.message}`);
        setIsLoading(false);
      }
    },
    [mataKuliahList, term, setJadwalRows, setCurrentStep]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => acceptedFiles[0] && processAndValidate(acceptedFiles[0]),
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    disabled: isLoading,
  });

  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
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
      const Papa = (await import('papaparse')).default;
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
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'template_jadwal.xlsx');
    }
  };

  return (
    <Card className="border shadow-sm w-full">
      <CardHeader>
        <CardTitle className="text-xl">Langkah 1: Upload Data</CardTitle>
        <CardDescription>
          Unggah file CSV berisi data jadwal praktikum untuk seluruh mata kuliah pada angkatan {term}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-destructive/50 text-destructive bg-destructive/10">
            <AlertDescription className="flex items-start gap-2">
              <X size={16} className="mt-0.5 flex-shrink-0" />
              <span className="text-sm whitespace-pre-wrap">{error}</span>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="jadwal-csv-upload" className="text-sm font-medium leading-none">
              Upload File CSV
            </label>
            {fileName && !isLoading && (
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
                : 'border-border bg-transparent hover:border-primary/50',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input {...getInputProps()} id="jadwal-csv-upload" />
            {isLoading ? (
              <Loader2 size={40} className="mx-auto mb-3 text-primary animate-spin" />
            ) : (
              <FileSpreadsheet size={40} className="mx-auto mb-3 text-muted-foreground" />
            )}
            {isDragActive ? (
              <p className="text-primary font-semibold">Drop CSV file di sini...</p>
            ) : isLoading ? (
              <p className="font-medium text-primary">Memproses & Memvalidasi Jadwal...</p>
            ) : (
              <>
                <p className="font-medium">Drag & drop CSV file di sini</p>
                <p className="text-xs text-muted-foreground mt-1">atau klik untuk pilih file</p>
              </>
            )}
          </div>

          <div className="bg-muted/30 p-4 rounded-lg border border-border/50 mt-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Format Kolom Wajib:</p>
            <div className="flex flex-wrap gap-2 mb-1">
              {['Kelas', 'Nama Singkat', 'Hari', 'Sesi', 'Jam', 'Ruangan', 'Total Asprak', 'Dosen'].map(
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
            <p className="text-[10px] text-muted-foreground/60 mb-4">
              * Kolom <strong>Nama Singkat</strong> (Mata Kuliah) harus sesuai dengan nama yang
              ada di database. Sistem akan memotong teks secara otomatis jika ada "&".
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-border/50">
              <span className="text-xs font-medium flex items-center gap-1.5">
                <Download size={14} className="text-muted-foreground" />
                Download Template:
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-background shadow-sm hover:bg-muted"
                  onClick={() => handleDownloadTemplate('csv')}
                  disabled={isLoading}
                >
                  <FileText size={14} className="text-sky-500" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-background shadow-sm hover:bg-muted"
                  onClick={() => handleDownloadTemplate('xlsx')}
                  disabled={isLoading}
                >
                  <FileSpreadsheet size={14} className="text-emerald-500" />
                  XLSX
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
