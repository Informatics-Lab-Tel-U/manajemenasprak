'use client';

import { useState, useCallback, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import PraktikumCSVPreview, { PraktikumPreviewRow } from '../../praktikum/PraktikumCSVPreview';
import { validatePraktikumData } from '@/utils/validation/praktikumValidation';
import { fetchAllPraktikum } from '@/lib/fetchers/praktikumFetcher';

interface StepPraktikumProps {
  data: any[];
  onNext: () => void;
  onPrev?: () => void;
  onImport: (rows: { nama: string; tahun_ajaran: string }[]) => Promise<void>;
}

export default function StepPraktikum({ data, onNext, onPrev, onImport }: StepPraktikumProps) {
  const [previewRows, setPreviewRows] = useState<PraktikumPreviewRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    let active = true;

    async function process() {
      if (!data || data.length === 0) {
        setError('Data CSV/Excel Praktikum kosong.');
        return;
      }

      try {
        const res = await fetchAllPraktikum();
        if (!active) return;

        let existing: { nama: string; tahun_ajaran: string }[] = [];
        if (res.ok && res.data) {
          existing = res.data.map((p: any) => ({
            nama: p.nama,
            tahun_ajaran: p.tahun_ajaran,
          }));
        }

        const preview = validatePraktikumData(data, existing);
        setPreviewRows(preview);
      } catch (err: any) {
        if (active)
          setError(err.message || 'Gagal memuat data praktikum dari database untuk validasi.');
      } finally {
        if (active) setIsFetching(false);
      }
    }

    process();

    return () => {
      active = false;
    };
  }, [data]);

  const handleToggleSelect = useCallback((rowIndex: number) => {
    setPreviewRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[rowIndex] };
      if (row.status !== 'error' && row.status !== 'skipped') {
        row.selected = !row.selected;
        updated[rowIndex] = row;
      }
      return updated;
    });
  }, []);

  const handleToggleAll = useCallback((checked: boolean) => {
    setPreviewRows((prev) => {
      return prev.map((row) => {
        if (row.status !== 'error' && row.status !== 'skipped') {
          return { ...row, selected: checked };
        }
        return row;
      });
    });
  }, []);

  const handleConfirm = async () => {
    const selectedRows = previewRows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      onNext();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onImport(
        selectedRows.map((r) => ({
          nama: r.nama,
          tahun_ajaran: r.tahun_ajaran,
        }))
      );
      onNext();
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan data.');
      setSaving(false);
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
    <div className="space-y-4">
      {error && (
        <Alert className="mb-4 border-destructive/50 text-destructive">
          <AlertDescription className="flex items-start gap-2">
            <X size={16} className="mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 border rounded-md p-4">
        <PraktikumCSVPreview
          rows={previewRows}
          onToggleSelect={handleToggleSelect}
          onToggleAll={handleToggleAll}
        />
        <div className="flex justify-between items-center pt-2">
          <Button type="button" variant="outline" onClick={onPrev || onNext} disabled={saving}>
            Kembali
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={onNext} disabled={saving}>
              Lewati Langkah Ini
            </Button>
            <Button onClick={handleConfirm} disabled={saving || previewRows.filter(r => r.selected).length === 0} variant="default">
              {saving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Menyimpan...
                </>
              ) : `Simpan ${previewRows.filter(r => r.selected).length} Data Terpilih`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
