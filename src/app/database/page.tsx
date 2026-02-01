'use client';

import { useState, useCallback } from 'react';
import { Trash2, Upload, FileSpreadsheet, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as importFetcher from '@/lib/fetchers/importFetcher';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export default function DatabasePage() {
  const [termYear, setTermYear] = useState('24');
  const [termSem, setTermSem] = useState<'1' | '2'>('2');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const startY = parseInt(termYear);
      const term = `${startY}${startY + 1}-${termSem}`;

      setLoading(true);
      setStatus({ type: 'info', message: `Processing ${file.name} for term: ${term}...` });

      try {
        const result = await importFetcher.uploadExcel(file, term);

        if (result.ok) {
          setStatus({
            type: 'success',
            message: result.message || `Successfully imported ${file.name}!`,
          });
        } else if (result.error?.includes('CONFLICT:')) {
          const userWantsToSkip = confirm(
            `${result.error}\n\nDo you want to SKIP this conflicting asprak and continue with others?`
          );
          if (userWantsToSkip) {
            setStatus({ type: 'info', message: `Retrying (Skipping Conflicts)...` });
            const retryResult = await importFetcher.uploadExcel(file, term, {
              skipConflicts: true,
            });
            if (retryResult.ok) {
              setStatus({ type: 'success', message: `Imported ${file.name} (Conflicts Skipped)!` });
            } else {
              setStatus({ type: 'error', message: retryResult.error || 'Retry failed' });
            }
          } else {
            setStatus({ type: 'error', message: result.error });
          }
        } else {
          setStatus({ type: 'error', message: result.error || 'Import failed' });
        }
      } catch (e: any) {
        setStatus({ type: 'error', message: e.message || 'Import failed' });
      } finally {
        setLoading(false);
      }
    },
    [termYear, termSem]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
  });

  const handleClear = async () => {
    if (!confirm('WARNING: Ini akan menghapus SEMUA data Jadwal, Asprak, Praktikum, dll. Yakin?'))
      return;

    setLoading(true);
    setStatus({ type: 'info', message: 'Clearing database...' });

    try {
      const res = await fetch('/api/clear', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus({ type: 'success', message: 'Database successfully cleared!' });
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const startY = parseInt(termYear);
    const termStr = `${startY}${startY + 1}-${termSem}`;

    const praktikumRows = [
      { nama_singkat: 'PBO', tahun_ajaran: termStr },
      { nama_singkat: 'ALPRO', tahun_ajaran: termStr },
      { nama_singkat: 'JARKOM', tahun_ajaran: termStr },
    ];
    const wsPraktikum = XLSX.utils.json_to_sheet(praktikumRows);
    XLSX.utils.book_append_sheet(wb, wsPraktikum, 'praktikum');

    const mkRows = [
      {
        mk_singkat: 'PBO',
        program_studi: 'IF',
        nama_lengkap: 'Pemrograman Berorientasi Objek',
        dosen_koor: 'ABC',
      },
      {
        mk_singkat: 'ALPRO',
        program_studi: 'SE',
        nama_lengkap: 'Algoritma Pemrograman',
        dosen_koor: 'DEF',
      },
      {
        mk_singkat: 'JARKOM',
        program_studi: 'IF',
        nama_lengkap: 'Jaringan Komputer',
        dosen_koor: 'GHI',
      },
    ];
    const wsMk = XLSX.utils.json_to_sheet(mkRows);
    XLSX.utils.book_append_sheet(wb, wsMk, 'mata_kuliah');

    const asprakRows = [
      { nim: '1201210001', nama_lengkap: 'Budi Santoso', kode: 'BDS', angkatan: '21' },
      { nim: '1201210002', nama_lengkap: 'Siti Aminah', kode: 'SIT', angkatan: '21' },
      { nim: '1201210003', nama_lengkap: 'Ahmad Dani', kode: 'ADM', angkatan: '21' },
    ];
    const wsAsprak = XLSX.utils.json_to_sheet(asprakRows);
    XLSX.utils.book_append_sheet(wb, wsAsprak, 'asprak');

    const jadwalRows = [
      {
        kelas: 'IF-45-01',
        nama_singkat: 'PBO',
        hari: 'SENIN',
        sesi: 1,
        jam: '06:30',
        ruangan: 'TULT 0612',
        total_asprak: 2,
        dosen: 'ABC',
      },
      {
        kelas: 'SE-45-02',
        nama_singkat: 'ALPRO',
        hari: 'SELASA',
        sesi: 2,
        jam: '08:30',
        ruangan: 'GKU 0201',
        total_asprak: 3,
        dosen: 'DEF',
      },
      {
        kelas: 'IF-45-03',
        nama_singkat: 'JARKOM',
        hari: 'RABU',
        sesi: 3,
        jam: '10:30',
        ruangan: 'TULT 0505',
        total_asprak: 2,
        dosen: 'GHI',
      },
    ];
    const wsJadwal = XLSX.utils.json_to_sheet(jadwalRows);
    XLSX.utils.book_append_sheet(wb, wsJadwal, 'jadwal');

    const pivotRows = [
      { kode_asprak: 'BDS', mk_singkat: 'PBO' },
      { kode_asprak: 'SIT', mk_singkat: 'ALPRO' },
      { kode_asprak: 'ADM', mk_singkat: 'JARKOM' },
    ];
    const wsPivot = XLSX.utils.json_to_sheet(pivotRows);
    XLSX.utils.book_append_sheet(wb, wsPivot, 'asprak_praktikum');

    XLSX.writeFile(wb, `${termStr}_TEMPLATE.xlsx`);
  };

  return (
    <div className="container">
      <header className="mb-8">
        <h1 className="title-gradient text-4xl font-bold">
          Database Manager{' '}
          <span className="text-base opacity-60 font-normal">(Developer Mode)</span>
        </h1>
        <p className="text-muted-foreground mt-1">Manage imports and cleanup</p>
      </header>

      {status && (
        <Alert
          className={cn(
            'mb-8',
            status.type === 'error' && 'border-destructive/50 text-destructive',
            status.type === 'success' && 'border-chart-4/50 text-chart-4',
            status.type === 'info' && 'border-chart-2/50 text-chart-2'
          )}
        >
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        {/* Import Section - Dropzone */}
        <Card className="bg-card/80 backdrop-blur-sm shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-chart-2/10 text-chart-2">
                <Upload size={24} />
              </div>
              Import Excel Dataset
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Tahun Ajaran</Label>
              <div className="flex items-center gap-2">
                <Input
                  required
                  type="number"
                  min="10"
                  max="99"
                  placeholder="YY"
                  value={termYear}
                  onChange={(e) => setTermYear(e.target.value)}
                  className="w-20 text-center"
                />

                <span className="text-muted-foreground">/</span>

                <div className="w-20 px-3 py-2 bg-muted/30 rounded-md text-muted-foreground text-center text-sm">
                  {termYear ? parseInt(termYear) + 1 : 'YY'}
                </div>

                <span className="text-muted-foreground">-</span>

                <Select value={termSem} onValueChange={(val) => setTermSem(val as '1' | '2')}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="1">1 (Ganjil)</SelectItem>
                      <SelectItem value="2">2 (Genap)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Isi ini untuk otomatis mengisi tahun ajaran jika di Excel kosong.
              </p>
            </div>

            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all',
                isDragActive
                  ? 'border-chart-2 bg-chart-2/5'
                  : 'border-border bg-transparent hover:border-chart-2/50'
              )}
            >
              <input {...getInputProps()} />
              <FileSpreadsheet size={48} className="text-muted-foreground mb-4 mx-auto" />
              {isDragActive ? (
                <p className="text-chart-2 font-semibold">Drop the Excel file here...</p>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium">Drag & drop dataset .xlsx here</p>
                  <p className="text-sm text-muted-foreground">or click to select file</p>
                  <p className="text-xs text-muted-foreground mt-4">
                    Must contain sheets: praktikum, mata_kuliah, asprak, jadwal, asprak_praktikum
                  </p>
                </div>
              )}

              {loading && <p className="mt-4 text-chart-4">Processing...</p>}
            </div>

            {/* Download Template Button */}
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="w-full border-chart-4/50 text-chart-4 hover:bg-chart-4/10"
            >
              <Download size={16} />
              Download Template Excel
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Template includes example rows. Reference files also available in app assets
              (public/references).
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-card/80 backdrop-blur-sm shadow-md border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-destructive">
              <div className="p-3 rounded-xl bg-destructive/10">
                <Trash2 size={24} />
              </div>
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tindakan ini tidak dapat dibatalkan. Pastikan Anda tahu apa yang Anda lakukan.
            </p>

            <Button
              onClick={handleClear}
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              Clear All Database Content
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
