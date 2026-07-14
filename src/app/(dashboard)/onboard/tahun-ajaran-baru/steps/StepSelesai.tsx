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
import { BookOpen, CheckCircle2, FileSpreadsheet, Download, FileText, AlertCircle, Copy, Save, RefreshCw, Loader2, ArrowLeft, Calendar } from 'lucide-react';
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


export default function SelesaiStep() {
  const { resetProgress } = useOnboardingStore();

  const handleFinish = () => {
    resetProgress();
    window.location.href = '/onboard';
  };

  return (
    <Card className="border shadow-sm bg-card">
      <CardContent className="flex flex-col items-center text-center pt-8 pb-8 px-6 space-y-6">
        <div className="flex justify-center">
          <CheckCircle2 className="w-16 h-16 text-primary" strokeWidth={1.5} />
        </div>
        
        <div className="space-y-3 max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight">Tahun Ajaran Berhasil Dibuat</h2>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Pondasi data untuk tahun ajaran baru sudah berhasil disiapkan. Anda sudah bisa mulai mengelola praktikum dan mata kuliah melalui <strong className="text-foreground font-medium">Global Term Selector</strong> di pojok kanan atas.
          </p>
        </div>

        <div className="w-full max-w-lg rounded-xl border bg-muted/30 p-4 mt-2 text-left transition-colors hover:bg-muted/50">
          <div className="flex gap-4">
            <div className="bg-background shadow-sm border p-2.5 rounded-lg h-fit">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Langkah Selanjutnya</h4>
              <p className="text-sm text-muted-foreground leading-snug">
                Konfigurasi jadwal per modul di menu <span className="font-medium text-foreground">Jadwal Praktikum &gt; Tanggal Mulai Modul</span> agar asisten dapat mulai melakukan pengaturan jadwal.
              </p>
            </div>
          </div>
        </div>

        <div>
          <Button size="lg" onClick={handleFinish}>
            Selesai & Kembali ke Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

