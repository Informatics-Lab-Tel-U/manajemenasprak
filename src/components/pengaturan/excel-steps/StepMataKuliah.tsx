'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Loader2 } from 'lucide-react';
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
  const [localValidPraktikums, setLocalValidPraktikums] = useState<{ id: string; nama: string }[]>([]);
  const [existingMataKuliah, setExistingMataKuliah] = useState<MataKuliahGrouped[]>([]);
  
  const isValidProdi = (prodi: string) => {
    const base = prodi?.replace('-PJJ', '') || '';
    return ['IF', 'IT', 'SE', 'DS'].includes(base);
  };

  // Fetch valid praktikums AND existing MK for the term
  useEffect(() => {
    let active = true;

    async function fetchData() {
      if (!term || term.length < 6) return; // e.g., '2425-2'

      try {
        const [praktikumRes, mkRes] = await Promise.all([
          fetch(`/api/praktikum?action=by-term&term=${term}`),
          fetch(`/api/mata-kuliah?term=${term}`),
        ]);

        if (active && praktikumRes.ok) {
          const json = await praktikumRes.json();
          if (json.ok && Array.isArray(json.data)) {
            setLocalValidPraktikums(json.data);
          } else {
            setLocalValidPraktikums([]);
          }
        }

        if (active && mkRes.ok) {
          const mkJson = await mkRes.json();
          if (mkJson.ok && Array.isArray(mkJson.data)) {
            setExistingMataKuliah(mkJson.data);
          } else {
            setExistingMataKuliah([]);
          }
        }
      } catch (e: any) {
        console.error(e);
      } finally {
        if (active) setIsFetching(false);
      }
    }

    fetchData();
    return () => {
      active = false;
    };
  }, [term]);

  // Process data after fetch is complete (or updated)
  useEffect(() => {
      if (!data || data.length === 0) {
          setError('Data Excel Mata Kuliah kosong.');
          return;
      }
      
      const transformed = validateMataKuliahData(data, localValidPraktikums, existingMataKuliah);
      setParsedRows(transformed);
  }, [data, localValidPraktikums, existingMataKuliah]);

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
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
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

      <MataKuliahCSVPreview
        rows={parsedRows}
        loading={loading}
        validPraktikums={localValidPraktikums}
        term={term}
        onConfirm={handleConfirmImport}
        onBack={onPrev || onNext} // Skip/Next representation in sequence
        onUpdateRow={handleUpdateRow}
        onToggleSelect={handleToggleSelect}
        onToggleAll={handleToggleAll}
        onSkip={onNext}
      />
    </div>
  );
}
