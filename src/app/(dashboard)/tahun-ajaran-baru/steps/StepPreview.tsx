'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperSeparator,
  StepperTitle,
  StepperDescription,
  StepperNav,
  StepperContent,
  useStepper,
} from '@/components/ui/stepper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, CheckCircle2, FileSpreadsheet, Download, FileText, AlertCircle, Copy, Save, RefreshCw, Loader2 , ArrowLeft} from 'lucide-react';
import { toast } from 'sonner';

import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import PraktikumCSVPreview, { PraktikumPreviewRow } from '@/components/praktikum/PraktikumCSVPreview';
import { validatePraktikumData } from '@/utils/validation/praktikumValidation';
import MataKuliahCSVPreview, { MataKuliahCSVRow } from '@/components/mata-kuliah/MataKuliahCSVPreview';
import { validateMataKuliahData } from '@/utils/validation/mataKuliahValidation';
import { usePraktikum } from '@/hooks/usePraktikum';
import { cn } from '@/lib/utils';
import { 
  useOnboardingStore, 
  useAutosaveStatus
} from '@/store/useOnboardingStore';
import { Field, FieldLabel, FieldContent } from '@/components/ui/field';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TermInput from '@/components/asprak/TermInput';
import { buildTermString } from '@/utils/termHelpers';
import { useTermStore } from '@/store/useTermStore';

const steps = [
  { id: 'praktikum', title: 'Data Praktikum', description: 'Buat tahun ajaran', icon: <BookOpen /> },
  { id: 'matkul', title: 'Mata Kuliah', description: 'Tambahkan MK', icon: <BookOpen /> },
  { id: 'jadwal', title: 'Preview & Simpan', description: 'Konfirmasi Data', icon: <Save /> },
  { id: 'selesai', title: 'Selesai', description: 'Setup berhasil', icon: <CheckCircle2 /> },
];


export default function PreviewStep() {
  const { draft, setCurrentStep, markStepCompleted } = useOnboardingStore();
  const [loading, setLoading] = useState(false);

  const praktikumList = draft.praktikumList || [];
  const mkList = draft.mataKuliahData || [];

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const payload = {
        praktikumList,
        mataKuliahList: mkList
      };

      const res = await fetch('/api/tahun-ajaran/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || 'Gagal menyimpan data ke database');
      
      toast.success('Semua data berhasil disimpan ke Database!');
      markStepCompleted('jadwal');
      setCurrentStep('selesai');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Langkah 3: Preview & Simpan Permanen</CardTitle>
        <CardDescription>
          Harap periksa kembali draf Praktikum dan Mata Kuliah Anda sebelum menyimpannya secara permanen ke Database.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        <div className="space-y-4">
          {praktikumList.map((prak, pIdx) => {
            const mks = mkList.filter(mk => mk.id_praktikum === prak.tempId);
            return (
              <div key={prak.tempId} className="border rounded-lg p-4 bg-muted/5">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{pIdx + 1}</div>
                    <h3 className="font-semibold text-lg">{prak.nama} <span className="text-sm font-normal text-muted-foreground">({prak.tahun_ajaran})</span></h3>
                  </div>
                </div>
                {mks.length > 0 ? (
                  <div className="pl-8 space-y-2">
                    {mks.map((mk, idx) => (
                      <div key={mk.id || idx} className="flex items-center gap-2 text-sm border-l-2 pl-3 py-1">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span>{mk.nama_lengkap} <span className="text-muted-foreground">- {mk.program_studi}</span></span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="pl-8 text-sm text-muted-foreground italic">Tidak ada Mata Kuliah</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="justify-between pt-4 pb-6 bg-muted/10 border-t">
        <Button type="button" variant="ghost" onClick={() => setCurrentStep('matkul')} disabled={loading}>Sebelumnya</Button>
        <Button onClick={handleSaveAll} disabled={loading} size="lg">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Selanjutnya
        </Button>
      </CardFooter>
    </Card>
  );
}
