import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ExtendedPreviewRow } from '@/utils/validation/plottingValidation';

export type AsprakOnboardStep = 'data_asprak' | 'plotting' | 'preview-final' | 'selesai';

export interface RawCSVRow {
  nama_lengkap?: string;
  nim?: string;
  kode?: string;
  role?: string;
  angkatan?: string | number;
}

export interface ValidatedAsprakRow {
  nim: string;
  nama_lengkap: string;
  kode: string;
  role: 'ASPRAK' | 'ASLAB';
  angkatan: number;
}

export interface ValidatedPlottingRow {
  asprak_id: string; // The selected ID or a placeholder if new
  kode_asprak: string;
  praktikum_id: string;
  mk_singkat: string;
}

interface AsprakOnboardState {
  currentStep: AsprakOnboardStep;
  completedSteps: AsprakOnboardStep[];
  asprakRows: RawCSVRow[];
  validatedAsprakRows: ValidatedAsprakRow[];
  plottingPreviewRows: ExtendedPreviewRow[];
  validatedPlottingRows: ValidatedPlottingRow[];
  targetTerm: string | null;

  // Actions
  setCurrentStep: (step: AsprakOnboardStep) => void;
  markStepCompleted: (step: AsprakOnboardStep) => void;
  unmarkStepCompleted: (step: AsprakOnboardStep) => void;
  setAsprakRows: (rows: RawCSVRow[]) => void;
  setValidatedAsprakRows: (rows: ValidatedAsprakRow[]) => void;
  setPlottingPreviewRows: (rows: ExtendedPreviewRow[]) => void;
  setValidatedPlottingRows: (rows: ValidatedPlottingRow[]) => void;
  setTargetTerm: (term: string) => void;
  resetProgress: () => void;
}

const INITIAL_STATE = {
  currentStep: 'data_asprak' as AsprakOnboardStep,
  completedSteps: [],
  asprakRows: [],
  validatedAsprakRows: [],
  plottingPreviewRows: [],
  validatedPlottingRows: [],
  targetTerm: null,
};

export const useAsprakOnboardStore = create<AsprakOnboardState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      setCurrentStep: (step) => set({ currentStep: step }),

      markStepCompleted: (step) =>
        set((state) => {
          if (state.completedSteps.includes(step)) return state;
          return { completedSteps: [...state.completedSteps, step] };
        }),

      unmarkStepCompleted: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.filter((s) => s !== step),
        })),

      setAsprakRows: (rows) => set({ asprakRows: rows }),

      setValidatedAsprakRows: (rows) => set({ validatedAsprakRows: rows }),

      setPlottingPreviewRows: (rows) => set({ plottingPreviewRows: rows }),

      setValidatedPlottingRows: (rows) => set({ validatedPlottingRows: rows }),

      setTargetTerm: (term) => set({ targetTerm: term }),

      resetProgress: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: 'asprak-onboard-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
