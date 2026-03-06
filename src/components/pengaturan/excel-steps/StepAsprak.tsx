'use client';

import { useState, useCallback, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { X, Loader2 } from 'lucide-react';
import AsprakCSVPreview, { PreviewRow } from '../../asprak/AsprakCSVPreview';
import type { ExistingAsprakInfo } from '../../asprak/AsprakImportCSVModal';
import { validateAsprakData, validateAsprakCodeEdit } from '@/utils/validation/asprakValidation';

interface StepAsprakProps {
  data: any[];
  term: string;
  onNext: () => void;
  onPrev?: () => void;
  onImport: (
    rows: { nim: string; nama_lengkap: string; kode: string; angkatan: number }[],
    term: string
  ) => Promise<void>;
}

export default function StepAsprak({
  data,
  term,
  onNext,
  onPrev,
  onImport,
}: StepAsprakProps) {
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [forceOverride, setForceOverride] = useState(false);
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);

  // Asprak specific existing data fetched independently
  const [existingCodes, setExistingCodes] = useState<string[]>([]);
  const [existingNims, setExistingNims] = useState<string[]>([]);
  const [existingAspraks, setExistingAspraks] = useState<ExistingAsprakInfo[]>([]);

  useEffect(() => {
    let active = true;

    async function fetchAsprakInfo() {
      try {
        const res = await fetch('/api/asprak?action=all-info');
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          if (json.ok && Array.isArray(json.data)) {
            const dataArr = json.data;
            setExistingAspraks(dataArr);
            setExistingCodes(dataArr.map((a: any) => a.kode));
            setExistingNims(dataArr.map((a: any) => a.nim));
          }
        }
      } catch (err: any) {
        if (active) {
            console.error('Failed fetching aspraks info:', err);
            setError('Gagal mengambil data asprak eksisting.');
        }
      } finally {
        if (active) setIsFetching(false);
      }
    }

    fetchAsprakInfo();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
      if (!data || data.length === 0) {
          setError('Data Excel Asprak kosong.');
          return;
      }
      
      try {
        const preview = validateAsprakData(data, existingCodes, existingNims, forceOverride);
        setPreviewRows(preview);
      } catch (e: any) {
        setError(`Error saat menyiapkan data: ${e.message}`);
      }
  }, [data, existingCodes, existingNims, existingAspraks, forceOverride]);

  const handleToggleSelect = useCallback((rowIndex: number) => {
    setPreviewRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[rowIndex] };
      if (row.status !== 'error' && row.status !== 'duplicate-csv') {
        row.selected = !row.selected;
        updated[rowIndex] = row;
      }
      return updated;
    });
  }, []);

  const handleToggleAll = useCallback((checked: boolean) => {
    setPreviewRows((prev) => {
      return prev.map((row) => {
        if (row.status !== 'error' && row.status !== 'duplicate-csv') {
          return { ...row, selected: checked };
        }
        return row;
      });
    });
  }, []);

  const handleCodeEdit = useCallback(
    (rowIndex: number, newCode: string) => {
      setPreviewRows((prev) => validateAsprakCodeEdit(rowIndex, newCode, prev, existingAspraks, forceOverride));
    },
    [existingAspraks, forceOverride]
  );

  const handleForceOverrideToggle = useCallback((checked: boolean) => {
      if (checked) {
          setShowOverrideConfirm(true);
      } else {
          setForceOverride(false);
      }
  }, []);

  const confirmOverride = () => {
      setForceOverride(true);
      setShowOverrideConfirm(false);
  };

  const cancelOverride = () => {
      setForceOverride(false);
      setShowOverrideConfirm(false);
  };

  const handleConfirmImport = async () => {
    const selectedRows = previewRows.filter(
      (r) => r.selected && (r.status === 'ok' || r.status === 'warning')
    );

    if (selectedRows.length === 0) {
        onNext();
        return;
    }

    setSaving(true);
    setError(null);

    try {
      await onImport(
        selectedRows.map((r) => ({
          nim: r.nim,
          nama_lengkap: r.nama_lengkap,
          kode: r.kode,
          angkatan: r.angkatan,
        })),
        term
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

      <AsprakCSVPreview
        rows={previewRows}
        term={term}
        onConfirm={handleConfirmImport}
        onBack={onPrev || onNext}
        onCodeEdit={handleCodeEdit}
        onToggleSelect={handleToggleSelect}
        onToggleAll={handleToggleAll}
        loading={saving}
        onSkip={onNext}
        forceOverride={forceOverride}
        onForceOverrideChange={handleForceOverrideToggle}
      />

      <AlertDialog open={showOverrideConfirm} onOpenChange={setShowOverrideConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pemaksaan Kode</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin memaksakan kode dari CSV?
              <br /><br />
              <span className="font-semibold text-destructive">Perhatian:</span> Ini akan mengabaikan peringatan bentrok kode dari database, termasuk kode yang baru saja dipakai dalam selisih kurang dari 5 tahun. Tindakan ini akan me-refresh ulang preview data serta mereset input kode manual yang telah Anda ubah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelOverride}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOverride} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Ya, Paksa Gunakan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
