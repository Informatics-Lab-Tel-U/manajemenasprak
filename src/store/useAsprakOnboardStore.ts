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
  syncWithTerm: (term: string, isAlreadyDone?: boolean, dbPlottingList?: any[]) => void;
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
    (set, get) => ({
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

      syncWithTerm: (term, isAlreadyDone = false, dbPlottingList = []) => {
        const currentTargetTerm = get().targetTerm;
        const isDifferentTerm = currentTargetTerm !== term;
        const isPlottingRowsEmpty = get().plottingPreviewRows.length === 0;

        const mappedPlottingRows: ExtendedPreviewRow[] = (dbPlottingList || []).map((item: any, idx: number) => ({
          index: idx,
          kode_asprak: item.asprak?.kode || '???',
          mk_singkat: item.praktikum?.nama || '???',
          status: 'valid',
          selected: true,
          asprakId: item.asprak?.id,
          praktikumId: item.praktikum?.id,
        }));

        const mappedValidatedPlotting: ValidatedPlottingRow[] = (dbPlottingList || []).map((item: any) => ({
          asprak_id: item.asprak?.id,
          kode_asprak: item.asprak?.kode || '',
          praktikum_id: item.praktikum?.id,
          mk_singkat: item.praktikum?.nama || '',
        }));

        if (isDifferentTerm) {
          set({
            ...INITIAL_STATE,
            targetTerm: term,
            completedSteps: isAlreadyDone ? ['data_asprak', 'plotting', 'preview-final', 'selesai'] : [],
            plottingPreviewRows: isAlreadyDone ? mappedPlottingRows : [],
            validatedPlottingRows: isAlreadyDone ? mappedValidatedPlotting : [],
          });
        } else {
          // If same term, sync completedSteps with DB ground truth isAlreadyDone
          if (!isAlreadyDone) {
            set({
              completedSteps: [],
              targetTerm: term,
            });
          } else {
            set({
              completedSteps: ['data_asprak', 'plotting', 'preview-final', 'selesai'],
              targetTerm: term,
              plottingPreviewRows: isPlottingRowsEmpty && mappedPlottingRows.length > 0 ? mappedPlottingRows : get().plottingPreviewRows,
              validatedPlottingRows: isPlottingRowsEmpty && mappedValidatedPlotting.length > 0 ? mappedValidatedPlotting : get().validatedPlottingRows,
            });
          }
        }
      },

      resetProgress: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: 'asprak-onboard-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        targetTerm: state.targetTerm,
      }),
    }
  )
);
