'use client';

import { useState, useCallback, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Loader2 } from 'lucide-react';
import * as jadwalFetcher from '@/lib/fetchers/jadwalFetcher';
import JadwalCSVPreview, { JadwalPreviewRow } from '../../jadwal/JadwalCSVPreview';
import { validateJadwalConflicts, buildJadwalPreviewRows } from '@/utils/validation/jadwalValidation';

interface StepJadwalProps {
  data: any[];
  term: string;
  onNext: () => void;
  onPrev?: () => void;
  onImport: (rows: any[]) => Promise<void>;
}

export default function StepJadwal({
  data,
  term,
  onNext,
  onPrev,
  onImport,
}: StepJadwalProps) {
  const [previewRows, setPreviewRows] = useState<JadwalPreviewRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [mataKuliahList, setMataKuliahList] = useState<any[]>([]);

  useEffect(() => {
    let active = true;

    async function fetchMK() {
        if (!term) return;
        try {
            const res = await fetch(`/api/mata-kuliah?term=${term}`);
            if (!active) return;
            if (res.ok) {
                const json = await res.json();
                if (json.ok && Array.isArray(json.data)) {
                    // flatten grouped mk to simple list for easier search
                    const flat = json.data.reduce((acc: any[], group: any) => {
                        return [...acc, ...group.items];
                    }, []);
                    setMataKuliahList(flat);
                }
            }
        } catch (e) {
            console.error("Failed fetching MK for jadwal", e);
        } finally {
            if (active) setIsFetching(false);
        }
    }
    fetchMK();
    return () => { active = false; };
  }, [term]);

  // Replaced with imported validateJadwalConflicts

  useEffect(() => {
    let active = true;

    async function processCSV() {
        if (!data || data.length === 0) {
            setError('Data Excel Jadwal kosong.');
            return;
        }

        if (mataKuliahList.length === 0) {
            // Wait for mata kuliah list to load if needed. 
            // Technically it could be empty if term has no MK yet, 
            // but usually we import MK before Jadwal in this flow anyway.
        }

        const preview = buildJadwalPreviewRows(data, mataKuliahList, term);

        const validatedRows = await validateJadwalConflicts(preview, term);
        if (active) setPreviewRows(validatedRows);
    }
    
    processCSV();

    return () => { active = false; };
  }, [data, mataKuliahList, term]);

  const handleToggleSelect = (index: number) => {
    setPreviewRows((prev) => {
      const next = [...prev];
      if (next[index].status !== 'error') {
        next[index].selected = !next[index].selected;
      }
      return next;
    });
  };

  const handleToggleAll = (checked: boolean) => {
    setPreviewRows((prev) =>
      prev.map((r) => (r.status !== 'error' ? { ...r, selected: checked } : r))
    );
  };

  const handleConfirm = async () => {
    const selected = previewRows.filter((r) => r.selected && r.status !== 'error');
    if (selected.length === 0) {
        onNext();
        return;
    }

    setSaving(true);
    try {
      const payload = selected.map((r) => ({
        id_mk: r.id_mk,
        kelas: r.kelas,
        hari: r.hari,
        sesi: r.sesi,
        jam: r.jam,
        ruangan: r.ruangan,
        total_asprak: r.total_asprak,
        dosen: r.dosen,
      }));

      await onImport(payload);
      onNext();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data Jadwal');
    } finally {
      setSaving(false);
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
        <div className="p-4 shrink-0 pb-0">
          <Alert className="border-destructive/50 text-destructive">
            <AlertDescription className="flex items-start gap-2">
              <X size={16} className="mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="p-4 flex-1 h-full max-h-full">
          <JadwalCSVPreview
            rows={previewRows}
            onConfirm={handleConfirm}
            onBack={onPrev || onNext}
            onToggleSelect={handleToggleSelect}
            onToggleAll={handleToggleAll}
            loading={saving}
            onSkip={onNext}
          />
      </div>
    </div>
  );
}
