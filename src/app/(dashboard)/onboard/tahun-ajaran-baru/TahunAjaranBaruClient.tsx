'use client';

/* eslint-disable react-doctor/no-locale-format-in-render */

import Link from 'next/link';

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

import PraktikumStep from './steps/StepPraktikum';
import MatkulStep from './steps/StepMataKuliah';
import PreviewStep from './steps/StepPreview';
import SelesaiStep from './steps/StepSelesai';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, CheckCircle2, FileSpreadsheet, Download, FileText, AlertCircle, Copy, Save, RefreshCw, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { useDropzone } from 'react-dropzone';
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

export default function TahunAjaranBaruClient() {
  const { 
    currentStep, 
    setCurrentStep,
    completedSteps,
    draft,
    resetProgress 
  } = useOnboardingStore();
  
  const { lastSaved, isDirty } = useAutosaveStatus();

  return (
    <div className="container mx-auto max-w-[2000px] relative space-y-8 2xl:px-8" suppressHydrationWarning>
      <header className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0 mt-1">
            <Link href="/onboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl 2xl:text-4xl font-bold tracking-tight">Setup Tahun Ajaran Baru</h1>
            <p className="text-sm 2xl:text-base text-muted-foreground mt-2">
              Ikuti alur ini untuk menambahkan seluruh data semester baru secara berurutan agar sesuai dengan constraint sistem.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-muted-foreground text-right">
            {isDirty ? (
              <span className="flex items-center gap-1 text-amber-500"><RefreshCw className="w-3 h-3 animate-spin"/> Ada perubahan belum tersimpan</span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1 text-green-500"><Save className="w-3 h-3"/> Disimpan {lastSaved.toLocaleTimeString()}</span>
            ) : null}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10">
                Reset Progress
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Anda yakin ingin reset progress?</AlertDialogTitle>
                <AlertDialogDescription>
                  Draft dan data state saat ini akan dihapus. Data yang sudah tersimpan di database tidak akan terhapus.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={resetProgress} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Reset Progress
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <Stepper 
        steps={steps} 
        value={currentStep}
        onValueChange={(id) => {
          const targetIndex = steps.findIndex(s => s.id === id);
          const currentIndex = steps.findIndex(s => s.id === currentStep);
          // Allow going back or going to an already completed step
          if (targetIndex <= currentIndex || completedSteps.includes(id as any)) {
            setCurrentStep(id as any);
          } else {
            // If trying to jump ahead, check if previous step is completed
            const previousStepId = steps[targetIndex - 1]?.id;
            if (completedSteps.includes(previousStepId as any)) {
              setCurrentStep(id as any);
            } else {
              toast.error('Silakan selesaikan step saat ini terlebih dahulu.');
            }
          }
        }}
        className="flex flex-col w-full items-start gap-8"
      >
        <StepperNav className="w-full bg-card p-4 rounded-xl border shadow-sm">
          {steps.map((step, index) => (
            <StepperItem key={step.id} stepId={step.id} completed={completedSteps.includes(step.id as any)} className="relative flex-1">
              <StepperTrigger className="flex flex-col gap-2.5">
                <StepperIndicator />
                <div className="flex flex-col">
                  <StepperTitle>{step.title}</StepperTitle>
                  <StepperDescription className="text-nowrap max-md:hidden">{step.description}</StepperDescription>
                </div>
              </StepperTrigger>
              {steps.length > index + 1 && (
                <StepperSeparator className="absolute inset-x-0 top-2 right-[calc(-50%+18px)] left-[calc(50%+18px)]" />
              )}
            </StepperItem>
          ))}
        </StepperNav>

        <div className="w-full">
          <StepperContent value="praktikum">
            <PraktikumStep />
          </StepperContent>
          <StepperContent value="matkul">
            <MatkulStep />
          </StepperContent>
          <StepperContent value="jadwal">
            <PreviewStep />
          </StepperContent>
          <StepperContent value="selesai">
            <SelesaiStep />
          </StepperContent>
        </div>
      </Stepper>
    </div>
  );
}

