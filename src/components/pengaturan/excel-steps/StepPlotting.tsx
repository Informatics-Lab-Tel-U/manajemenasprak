'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Loader2 } from 'lucide-react';
import { validatePlottingImport, savePlotting } from '@/lib/fetchers/plottingFetcher';
import PlottingCSVPreview from '../../plotting/PlottingCSVPreview';
import { mapPlottingValidationResponse, handlePlottingResolve, ExtendedPreviewRow } from '@/utils/validation/plottingValidation';

interface StepPlottingProps {
  data: any[];
  term: string;
  onNext: () => void;
  onPrev?: () => void;
  onSuccess: () => void;
}

export default function StepPlotting({
  data,
  term,
  onNext,
  onPrev,
  onSuccess,
}: StepPlottingProps) {
  const [previewRows, setPreviewRows] = useState<ExtendedPreviewRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    let active = true;

    async function processData() {
        if (!data || data.length === 0) {
            setError('Data Excel Penugasan (Plotting) kosong.');
            setIsValidating(false);
            return;
        }

        if (!term) return;

        setIsValidating(true);
        setError(null);

        const rawRows = data.map((row: any) => ({
            kode_asprak: (row.kode_asprak || row['Kode Asprak'] || row.kode || row.Kode || '').trim(),
            mk_singkat: (row.mk_singkat || row['MK Singkat'] || row.mk || row.MK || '').trim(),
        })).filter((r: any) => r.kode_asprak && r.mk_singkat);

        if (rawRows.length === 0) {
            if (active) {
                setError('Data Excel kosong atau kolom (kode_asprak, mk_singkat) tidak sesuai.');
                setIsValidating(false);
            }
            return;
        }

        // Validate via API
        const res = await validatePlottingImport(rawRows, term);
        
        if (!active) return;
        setIsValidating(false);

        if (res.ok && res.data) {
           const mapped = mapPlottingValidationResponse(res.data);
           setPreviewRows(mapped);
        } else {
           setError(res.error || 'Validation failed');
        }
    }

    processData();

    return () => {
        active = false;
    };
  }, [data, term]);

  const handleResolve = (index: number, candidateId: string) => {
      setPreviewRows((prev) => handlePlottingResolve(index, candidateId, prev));
  };

  const handleConfirm = async () => {
      const payload: {asprak_id: string, praktikum_id: string}[] = [];
      
      previewRows.forEach(row => {
          if (!row.selected) return;
          if (row.status === 'invalid') return;
          
          // Valid rows
          if (row.status === 'valid' && row.asprakId && row.praktikumId) {
              payload.push({ asprak_id: row.asprakId, praktikum_id: row.praktikumId });
          }
          
          // Ambiguous rows (resolved via multiple selection)
          else if (row.status === 'ambiguous' && row.selectedCandidateIds && row.praktikumId) {
              row.selectedCandidateIds.forEach((id: string) => {
                  payload.push({ asprak_id: id, praktikum_id: row.praktikumId! });
              });
          }
      });
      
      if (payload.length === 0) {
          onNext();
          return;
      }

      setLoading(true);
      const res = await savePlotting(payload);
      setLoading(false);
      
      if (res.ok) {
          onSuccess();
          onNext();
      } else {
          setError(res.error || 'Gagal menyimpan penugasan asprak');
      }
  };

  if (isValidating) {
    return (
       <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-background/50 border rounded-md">
         <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
         <p className="text-sm text-muted-foreground">Memvalidasi data plotting dengan database...</p>
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

      <PlottingCSVPreview
        rows={previewRows}
        term={term}
        onConfirm={handleConfirm}
        onBack={onPrev || onNext}
        onResolve={handleResolve}
        onToggleSelect={(idx: number) => setPreviewRows(p => {
            const u = [...p]; u[idx].selected = !u[idx].selected; return u;
        })}
        onToggleAll={(checked: boolean) => setPreviewRows(p => p.map(r => r.status==='invalid' ? r : {...r, selected: checked}))}
        loading={loading}
        onSkip={onNext}
      />
    </div>
  );
}
