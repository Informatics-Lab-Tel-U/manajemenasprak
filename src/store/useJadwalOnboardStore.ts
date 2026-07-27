import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { JadwalPreviewRow } from '@/components/jadwal/JadwalCSVPreview';

export type JadwalOnboardStep = 'upload' | 'preview' | 'selesai';

interface JadwalOnboardState {
  currentStep: JadwalOnboardStep;
  completedSteps: JadwalOnboardStep[];
  jadwalRows: JadwalPreviewRow[];
  targetTerm: string | null;

  // Actions
  setCurrentStep: (step: JadwalOnboardStep) => void;
  markStepCompleted: (step: JadwalOnboardStep) => void;
  setJadwalRows: (rows: JadwalPreviewRow[]) => void;
  setTargetTerm: (term: string) => void;
  syncWithTerm: (term: string, isAlreadyDone?: boolean) => void;
  resetProgress: () => void;
}

const INITIAL_STATE = {
  currentStep: 'upload' as JadwalOnboardStep,
  completedSteps: [],
  jadwalRows: [],
  targetTerm: null,
};

export const useJadwalOnboardStore = create<JadwalOnboardState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setCurrentStep: (step) => set({ currentStep: step }),

      markStepCompleted: (step) =>
        set((state) => {
          if (state.completedSteps.includes(step)) return state;
          return { completedSteps: [...state.completedSteps, step] };
        }),

      setJadwalRows: (rows) => set({ jadwalRows: rows }),

      setTargetTerm: (term) => set({ targetTerm: term }),

      syncWithTerm: (term, isAlreadyDone = false) => {
        const currentTargetTerm = get().targetTerm;
        if (currentTargetTerm !== term) {
          set({
            ...INITIAL_STATE,
            targetTerm: term,
            completedSteps: isAlreadyDone ? ['upload', 'preview', 'selesai'] : [],
          });
        } else if (isAlreadyDone && get().completedSteps.length === 0) {
          set({
            completedSteps: ['upload', 'preview', 'selesai'],
          });
        }
      },

      resetProgress: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: 'jadwal-onboard-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        targetTerm: state.targetTerm,
      }),
    }
  )
);
