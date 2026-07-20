'use client';

/* eslint-disable react-doctor/no-chain-state-updates, react-doctor/no-cascading-set-state, react-doctor/no-effect-chain, react-doctor/rendering-hydration-no-flicker */

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, ArrowLeft, Save } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import MataKuliahCSVPreview, { MataKuliahCSVRow } from '../../mata-kuliah/MataKuliahCSVPreview';
import { validateMataKuliahData } from '@/utils/validation/mataKuliahValidation';
import type { MataKuliahGrouped } from '@/services/mataKuliahService';

interface StepMataKuliahProps {
  data: any[];
  term: string;
  onNext: () => void;
  onPrev?: () => void;
  onImport: (rows: any[], term: string) => Promise<void>;
}

export default function StepMataKuliah({
  data,
  term,
  onNext,
  onPrev,
  onImport,
}: StepMataKuliahProps) {
  const [parsedRows, setParsedRows] = useState<MataKuliahCSVRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [localValidPraktikums, setLocalValidPraktikums] = useState<{ id: string; nama: string }[]>(
    []
  );
  // eslint-disable-next-line react-doctor/rerender-state-only-in-handlers
  const [existingMataKuliah, setExistingMataKuliah] = useState<MataKuliahGrouped[]>([]);

  // Fetch valid praktikums AND existing MK for the term
  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      if (!term || term.length < 6) return; // e.g., '2425-2'

      try {
        // eslint-disable-next-line react-doctor/no-fetch-in-effect
        const [praktikumRes, mkRes] = await Promise.all([
          fetch(`/api/praktikum?action=by-term&term=${term}`, { signal: controller.signal }),
          fetch(`/api/mata-kuliah?term=${term}`, { signal: controller.signal }),
        ]);

        if (!controller.signal.aborted && praktikumRes.ok) {
          const json = await praktikumRes.json();
          if (json.ok && Array.isArray(json.data)) {
            setLocalValidPraktikums(json.data);
          } else {
            setLocalValidPraktikums([]);
          }
        }

        if (!controller.signal.aborted && mkRes.ok) {
          const mkJson = await mkRes.json();
          if (mkJson.ok && Array.isArray(mkJson.data)) {
            setExistingMataKuliah(mkJson.data);
          } else {
            setExistingMataKuliah([]);
          }
        }
      } catch (e: any) {
        if (!controller.signal.aborted) console.error(e);
      } finally {
        if (!controller.signal.aborted) setIsFetching(false);
      }
    }

    fetchData();
    return () => {
      controller.abort();
    };
  }, [term]);

  // Process data after fetch is complete (or updated)
  const [prevDeps, setPrevDeps] = useState({ data, localValidPraktikums, existingMataKuliah });

  if (
    data !== prevDeps.data ||
    localValidPraktikums !== prevDeps.localValidPraktikums ||
    existingMataKuliah !== prevDeps.existingMataKuliah
  ) {
    setPrevDeps({ data, localValidPraktikums, existingMataKuliah });
    if (!data || data.length === 0) {
      setError('Data Excel Mata Kuliah kosong.');
    } else {
      const transformed = validateMataKuliahData(data, localValidPraktikums, existingMataKuliah);
      setParsedRows(transformed);
    }
  }

  const handleUpdateRow = (index: number, updates: Partial<MataKuliahCSVRow>) => {
    const newRows = [...parsedRows];
    newRows[index] = { ...newRows[index], ...updates };
    setParsedRows(newRows);
  };

  const handleToggleSelect = (index: number) => {
    const newRows = [...parsedRows];
    newRows[index].selected = !newRows[index].selected;
    setParsedRows(newRows);
  };

  const handleToggleAll = (checked: boolean) => {
    const newRows = parsedRows.map((r) => ({
      ...r,
      selected: r.status === 'error' ? false : checked,
    }));
    setParsedRows(newRows);
  };

  const handleConfirmImport = async () => {
    try {
      const selectedRows = parsedRows.filter((r) => r.selected);
      if (selectedRows.length === 0) {
        onNext();
        return;
      }

      setLoading(true);
      const rowsToImport = selectedRows.map((r) => ({
        mk_singkat: r.mk_singkat,
        nama_lengkap: r.nama_lengkap,
        program_studi: r.program_studi,
        dosen_koor: r.dosen_koor,
      }));

      await onImport(rowsToImport, term);
      onNext();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-background/50 border rounded-md">
        <Spinner className="h-8 w-8 text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Memuat data eksisting untuk validasi...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-background/50 h-[80vh] border rounded-md">
      {error && (
        <div className="p-4 shrink-0">
          <Alert className="border-destructive/50 text-destructive">
            <AlertDescription className="flex items-start gap-2">
              <X size={16} className="mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        <MataKuliahCSVPreview
          rows={parsedRows}
          validPraktikums={localValidPraktikums}
          term={term}
          onUpdateRow={handleUpdateRow}
          onToggleSelect={handleToggleSelect}
          onToggleAll={handleToggleAll}
        />
      </div>
      <div className="flex justify-between items-center px-6 py-4 border-t bg-background shrink-0 gap-4 mt-auto shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)] z-30">
        <Button variant="outline" onClick={onPrev || onNext} disabled={loading} className="shrink-0 min-w-[140px]">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
        <div className="flex items-center gap-2 overflow-hidden justify-end flex-1">
          {parsedRows.filter((r) => r.status === 'error').length > 0 && (
            <span className="text-xs text-destructive font-medium mr-3 text-right hidden lg:inline-block">
              {parsedRows.filter((r) => r.status === 'error').length} data bermasalah & akan dilewati
            </span>
          )}
          <Button type="button" variant="secondary" onClick={onNext} disabled={loading} className="shrink-0 min-w-[140px]">
            Lewati Langkah Ini
          </Button>
          <Button onClick={handleConfirmImport} disabled={loading || parsedRows.filter(r => r.selected).length === 0} className="shrink-0 min-w-[160px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" /> Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Simpan {parsedRows.filter(r => r.selected).length} Data
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
