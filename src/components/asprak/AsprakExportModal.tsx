'use client';

import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

import TermInput, { buildTermString } from './TermInput';
import { fetchPlottingData } from '@/lib/fetchers/asprakFetcher';

interface AsprakExportModalProps {
  onClose: () => void;
  open: boolean;
}

export default function AsprakExportModal({ onClose, open }: AsprakExportModalProps) {
  const [isAllTerms, setIsAllTerms] = useState(true);
  const [termYear, setTermYear] = useState('25');
  const [termSem, setTermSem] = useState<'1' | '2'>('2');
  const [exporting, setExporting] = useState<false | 'csv' | 'xlsx'>(false);

  const term = useMemo(() => buildTermString(termYear, termSem), [termYear, termSem]);
  const isTermValid = term.length > 0 && !isNaN(parseInt(termYear));

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!isAllTerms && !isTermValid) {
      toast.error('Masukan tahun ajaran yang valid');
      return;
    }

    setExporting(format);

    try {
      const termToFetch = isAllTerms ? undefined : term;
      const result = await fetchPlottingData(termToFetch);

      if (!result.ok || !result.data) {
        throw new Error(result.error || 'Gagal mengambil data untuk di-export');
      }

      if (result.data.length === 0) {
        toast.info('Tidak ada data asisten praktikum untuk diexport.');
        setExporting(false);
        return;
      }

      // 1. Prepare data for "asprak"
      const dataAsprak = result.data.map((asprak) => ({
        nama_lengkap: asprak.nama_lengkap,
        nim: asprak.nim,
        kode: asprak.kode,
        angkatan: asprak.angkatan,
      }));

      // 2. Prepare data for "asprak_praktikum"
      const dataPlotting: { kode_asprak: string; mk_singkat: string }[] = [];
      result.data.forEach((asprak) => {
        if (asprak.assignments && asprak.assignments.length > 0) {
          asprak.assignments.forEach((assign) => {
            dataPlotting.push({
              kode_asprak: asprak.kode,
              mk_singkat: assign.nama,
            });
          });
        }
      });

      const termSuffix = isAllTerms ? 'All_Terms' : term;

      const triggerDownload = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };

      if (format === 'csv') {
        const csvAsprak = Papa.unparse(dataAsprak);
        triggerDownload(
          new Blob([csvAsprak], { type: 'text/csv;charset=utf-8;' }),
          `asprak_${termSuffix}.csv`
        );

        setTimeout(() => {
          if (dataPlotting.length > 0 || isAllTerms) {
            const csvPlotting = Papa.unparse(
              dataPlotting.length > 0 ? dataPlotting : [{ kode_asprak: '', mk_singkat: '' }]
            );
            triggerDownload(
              new Blob([csvPlotting], { type: 'text/csv;charset=utf-8;' }),
              `asprak_praktikum_${termSuffix}.csv`
            );
          }
        }, 500);
      } else {
        // Excel
        const wsAsprak = XLSX.utils.json_to_sheet(dataAsprak);
        const wbAsprak = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wbAsprak, wsAsprak, 'Data Asprak');
        XLSX.writeFile(wbAsprak, `asprak_${termSuffix}.xlsx`);

        setTimeout(() => {
          if (dataPlotting.length > 0 || isAllTerms) {
            const wsPlotting = XLSX.utils.json_to_sheet(
              dataPlotting.length > 0 ? dataPlotting : [{ kode_asprak: '', mk_singkat: '' }]
            );
            const wbPlotting = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wbPlotting, wsPlotting, 'Data Plotting');
            XLSX.writeFile(wbPlotting, `asprak_praktikum_${termSuffix}.xlsx`);
          }
        }, 500);
      }

      toast.success(`Berhasil memproses export dua file ${format.toUpperCase()}`, {
        description: 'Pastikan browser Anda mengizinkan download multiple file.',
      });
      onClose();
    } catch (e: any) {
      toast.error(`Terjadi kesalahan operasi: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download size={18} />
            Export Data Asprak
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center space-x-2">
            <Switch id="all-terms" checked={isAllTerms} onCheckedChange={setIsAllTerms} />
            <Label htmlFor="all-terms">Export semua term</Label>
          </div>

          {!isAllTerms && (
            <div className="pl-2 border-l-2 border-primary/20 animate-in slide-in-from-top-2">
              <TermInput
                termYear={termYear}
                termSem={termSem}
                onYearChange={setTermYear}
                onSemChange={setTermSem}
                label="Tahun Ajaran"
                description="Pilih term data yang akan diexport."
              />
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              className="flex-1"
              variant="outline"
              disabled={!!exporting || (!isAllTerms && !isTermValid)}
              onClick={() => handleExport('csv')}
            >
              {exporting === 'csv' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4 text-sky-500" />
              )}
              Export CSV
            </Button>
            <Button
              className="flex-1"
              disabled={!!exporting || (!isAllTerms && !isTermValid)}
              onClick={() => handleExport('xlsx')}
            >
              {exporting === 'xlsx' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-500" />
              )}
              Export Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
