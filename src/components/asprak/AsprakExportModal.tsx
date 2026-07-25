"use client";

/* eslint-disable react-doctor/no-impure-state-updater */
import { useState, useMemo } from 'react';

import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

import TermInput from './TermInput';
import { buildTermString } from '@/utils/termHelpers';
import { fetchPlottingData } from '@/lib/fetchers/asprakFetcher';
import { useTermStore } from '@/store/useTermStore';
import { exportSpreadsheet } from '@/lib/spreadsheet';

interface AsprakExportModalProps {
  onClose: () => void;
  open: boolean;
}

export default function AsprakExportModal({ onClose, open }: AsprakExportModalProps) {
  const { activeTerm } = useTermStore();
  const initialYear = activeTerm ? activeTerm.substring(0, 2) : '25';
  const initialSem = activeTerm && activeTerm.endsWith('2') ? '2' : '1';

  const [isAllTerms, setIsAllTerms] = useState(true);
  const [termYear, setTermYear] = useState(initialYear);
  const [termSem, setTermSem] = useState<'1' | '2'>(initialSem as '1' | '2');
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

      if (format === 'csv') {
        await exportSpreadsheet(dataAsprak, `asprak_${termSuffix}.csv`, 'Data Asprak', 'csv');
        
        if (dataPlotting.length > 0 || isAllTerms) {
          const plottingToExport = dataPlotting.length > 0 ? dataPlotting : [{ kode_asprak: '', mk_singkat: '' }];
          await exportSpreadsheet(plottingToExport, `asprak_praktikum_${termSuffix}.csv`, 'Data Plotting', 'csv');
        }
      } else {
        await exportSpreadsheet(dataAsprak, `asprak_${termSuffix}.xlsx`, 'Data Asprak', 'xlsx');
        
        if (dataPlotting.length > 0 || isAllTerms) {
          const plottingToExport = dataPlotting.length > 0 ? dataPlotting : [{ kode_asprak: '', mk_singkat: '' }];
          await exportSpreadsheet(plottingToExport, `asprak_praktikum_${termSuffix}.xlsx`, 'Data Plotting', 'xlsx');
        }
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
                <Spinner className="mr-2 h-4 w-4" />
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
                <Spinner className="mr-2 h-4 w-4" />
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
