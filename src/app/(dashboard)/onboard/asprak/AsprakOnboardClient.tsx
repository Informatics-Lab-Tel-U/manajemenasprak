'use client';

import { useEffect, useState } from 'react';
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
} from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Upload, Eye, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAsprakOnboardStore, AsprakOnboardStep } from '@/store/useAsprakOnboardStore';
import { ExistingNimInfo } from '@/utils/validation/asprakValidation';
import { ExistingAsprakInfo } from '@/components/asprak/AsprakImportCSVModal';

import StepDataAsprak from './steps/StepDataAsprak';
import StepPlottingAsprak from './steps/StepPlottingAsprak';
import StepPreviewFinalAsprak from './steps/StepPreviewFinalAsprak';
import StepSelesaiAsprak from './steps/StepSelesaiAsprak';

const steps = [
  {
    id: 'data_asprak',
    title: 'Data Asprak',
    description: 'Upload & Validasi Data',
    icon: <Upload className="w-5 h-5" />,
  },
  {
    id: 'plotting',
    title: 'Plotting',
    description: 'Upload CSV Penugasan',
    icon: <Upload className="w-5 h-5" />,
  },
  {
    id: 'preview-final',
    title: 'Preview Final',
    description: 'Simpan Keseluruhan',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  {
    id: 'selesai',
    title: 'Selesai',
    description: 'Asprak berhasil disimpan',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
];

interface AsprakOnboardClientProps {
  term: string;
  initialExistingCodes: string[];
  initialExistingNims: ExistingNimInfo[];
  initialExistingAspraks: ExistingAsprakInfo[];
}

export default function AsprakOnboardClient({
  term,
  initialExistingCodes,
  initialExistingNims,
  initialExistingAspraks,
}: AsprakOnboardClientProps) {
  const { currentStep, setCurrentStep, setTargetTerm, completedSteps } = useAsprakOnboardStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTargetTerm(term);
  }, [term, setTargetTerm]);

  if (!mounted) return null;



  return (
    <div className="container mx-auto max-w-[2000px] relative space-y-8 2xl:px-8">
      <header className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0 mt-1">
            <Link href="/onboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl 2xl:text-4xl font-bold tracking-tight">Setup Data Asprak</h1>
            <p className="text-sm 2xl:text-base text-muted-foreground mt-2">
              Ikuti alur ini untuk mengunggah dan memvalidasi data asisten praktikum secara berurutan.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground text-right border rounded-md px-3 py-1.5 bg-muted/20">
            Tahun Ajaran Target:{' '}
            <span className="font-bold text-foreground">{term}</span>
          </div>
        </div>
      </header>

      <Stepper
        steps={steps}
        value={currentStep}
        onValueChange={(id) => {
          const targetIndex = steps.findIndex((s) => s.id === id);
          const currentIndex = steps.findIndex((s) => s.id === currentStep);
          // Allow going back or to an already completed step
          if (targetIndex <= currentIndex || completedSteps.includes(id as any)) {
            setCurrentStep(id as AsprakOnboardStep);
          } else {
            // If trying to jump ahead, check if previous step is completed
            const previousStepId = steps[targetIndex - 1]?.id;
            if (completedSteps.includes(previousStepId as any)) {
              setCurrentStep(id as AsprakOnboardStep);
            }
          }
        }}
        className="flex flex-col w-full items-start gap-8"
      >
        <StepperNav className="w-full bg-card p-4 rounded-xl border shadow-sm">
          {steps.map((step, index) => (
            <StepperItem
              key={step.id}
              stepId={step.id}
              completed={completedSteps.includes(step.id as any)}
              className="relative flex-1"
            >
              <StepperTrigger className="flex flex-col gap-2.5">
                <StepperIndicator />
                <div className="flex flex-col">
                  <StepperTitle>{step.title}</StepperTitle>
                  <StepperDescription className="text-nowrap max-md:hidden">
                    {step.description}
                  </StepperDescription>
                </div>
              </StepperTrigger>
              {steps.length > index + 1 && (
                <StepperSeparator className="absolute inset-x-0 top-2 right-[calc(-50%+18px)] left-[calc(50%+18px)]" />
              )}
            </StepperItem>
          ))}
        </StepperNav>

        <div className="w-full">
          <StepperContent value="data_asprak">
            <StepDataAsprak
              term={term}
              existingCodes={initialExistingCodes}
              existingNims={initialExistingNims}
              existingAspraks={initialExistingAspraks}
            />
          </StepperContent>
          <StepperContent value="plotting">
            <StepPlottingAsprak term={term} />
          </StepperContent>
          <StepperContent value="preview-final">
            <StepPreviewFinalAsprak term={term} />
          </StepperContent>
          <StepperContent value="selesai">
            <StepSelesaiAsprak term={term} />
          </StepperContent>
        </div>
      </Stepper>
    </div>
  );
}
