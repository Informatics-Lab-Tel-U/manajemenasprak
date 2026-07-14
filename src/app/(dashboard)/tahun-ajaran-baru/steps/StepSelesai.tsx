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


export default function SelesaiStep() {
  const { resetProgress } = useOnboardingStore();

  const handleFinish = () => {
    resetProgress();
    window.location.href = '/';
  };

  return (
    <Card className="border shadow-sm bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto bg-green-500/10 p-4 rounded-full w-fit mb-4">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <CardTitle className="text-2xl text-green-700 dark:text-green-500">Tahun Ajaran Berhasil Diinisialisasi!</CardTitle>
        <CardDescription className="text-base mt-2">
          Pondasi data Anda sudah terbentuk. Tahun ajaran baru sudah tersedia di <strong>Global Term Selector</strong> di pojok kanan atas.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          Jangan lupa untuk melengkapi Konfigurasi Tanggal Modul di halaman <br/>
          <strong>Jadwal Praktikum &gt; Tanggal Mulai Modul</strong>.
        </p>
      </CardContent>
      <CardFooter className="justify-center pt-6 pb-8">
        <Button size="lg" onClick={handleFinish}>Selesai & Kembali ke Dashboard</Button>
      </CardFooter>
    </Card>
  );
}

