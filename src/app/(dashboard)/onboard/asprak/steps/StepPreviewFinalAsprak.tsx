'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { NavButton } from '@/components/ui/nav-button';
import { toast } from 'sonner';
import { useAsprakOnboardStore } from '@/store/useAsprakOnboardStore';
import { bulkImportAspraks } from '@/lib/fetchers/asprakFetcher';
import { savePlotting } from '@/lib/fetchers/plottingFetcher';
import { Badge } from '@/components/ui/badge';

interface StepPreviewFinalAsprakProps {
  term: string;
}

export default function StepPreviewFinalAsprak({ term }: StepPreviewFinalAsprakProps) {
  const { 
    validatedAsprakRows, 
    validatedPlottingRows, 
    setCurrentStep, 
    markStepCompleted 
  } = useAsprakOnboardStore();
  
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);

    try {
      // 1. Save Aspraks (Bulk Import)
      let idMap: Record<string, string> = {};
      
      if (validatedAsprakRows.length > 0) {
        const result = await bulkImportAspraks(validatedAsprakRows);

        if (!result.ok) {
          throw new Error(result.error || 'Gagal menyimpan data Asprak.');
        }

        if (result.data?.errors && result.data.errors.length > 0) {
          throw new Error(`DB Error saat menyimpan Asprak: ${result.data.errors.join(' | ')}`);
        }
        
        idMap = result.data?.kodeToIdMap || {};
      }

      // 2. Save Plotting
      if (validatedPlottingRows.length > 0) {
        const payload = validatedPlottingRows.map(row => {
          let finalId = row.asprak_id;
          // If the ID was a local placeholder, replace it with the real UUID from DB
          if (finalId.startsWith('pending_')) {
            const realId = idMap[row.kode_asprak];
            if (realId) {
              finalId = realId;
            }
          }
          return {
            asprak_id: finalId,
            praktikum_id: row.praktikum_id,
          };
        });

        // Some might still be missing if bulk upsert failed to return a map, but we trust it.
        const res = await savePlotting(payload);
        if (!res.ok) {
          throw new Error(res.error || 'Gagal menyimpan data Penugasan Plotting.');
        }
      }

      toast.success('Data Asprak dan Penugasan berhasil disimpan!');
      markStepCompleted('preview-final');
      setCurrentStep('selesai');
    } catch (e: any) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    setCurrentStep('plotting');
  };

  return (
    <Card className="border shadow-sm w-full">
      <CardHeader>
        <CardTitle className="text-xl">Langkah 3: Preview Final</CardTitle>
        <CardDescription>
          Ringkasan data keseluruhan yang akan disimpan secara permanen ke sistem.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-start gap-2 whitespace-pre-wrap">
              <X className="w-4 h-4 mt-0.5" />
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-muted/30 p-6 rounded-lg border border-border/50 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-lg">Profil Asprak</h3>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Total baris yang akan disimpan:</span>
              <span className="text-3xl font-bold">{validatedAsprakRows.length} <span className="text-base font-normal text-muted-foreground">asprak</span></span>
            </div>
            {validatedAsprakRows.length > 0 && (
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pt-2">
                {validatedAsprakRows.map((r, i) => (
                  <Badge key={r.nim || r.kode || i} variant="outline" className="bg-background">
                    {r.kode} - {r.nama_lengkap}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="bg-muted/30 p-6 rounded-lg border border-border/50 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-sky-500" />
              <h3 className="font-semibold text-lg">Penugasan (Plotting)</h3>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">Total penugasan yang akan dibuat:</span>
              <span className="text-3xl font-bold">{validatedPlottingRows.length} <span className="text-base font-normal text-muted-foreground">penugasan</span></span>
            </div>
            {validatedPlottingRows.length > 0 && (
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pt-2">
                {validatedPlottingRows.map((r, i) => (
                  <Badge key={`${r.kode_asprak}_${r.mk_singkat}`} variant="outline" className="bg-background">
                    {r.kode_asprak} ➔ {r.mk_singkat}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <Alert className="bg-primary/5 border-primary/20">
          <AlertDescription className="text-primary font-medium">
            Pastikan data di atas sudah benar. Setelah disimpan, data ini akan terlihat di menu utama Data Asprak.
          </AlertDescription>
        </Alert>

        <div className="flex justify-between items-center pt-4 border-t">
          <NavButton 
            direction="prev"
            variant="ghost" 
            onClick={handleBack} 
            disabled={saving}
          />
          <NavButton 
            direction="next"
            onClick={handleConfirm} 
            disabled={saving || (validatedAsprakRows.length === 0 && validatedPlottingRows.length === 0)}
            loading={saving}
            loadingText="Menyimpan Data..."
            className="min-w-[160px]"
          >
            Simpan Keseluruhan
          </NavButton>
        </div>
      </CardContent>
    </Card>
  );
}
