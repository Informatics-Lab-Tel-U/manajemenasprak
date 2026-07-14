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
    (set) => ({
      ...INITIAL_STATE,

      setCurrentStep: (step) => set({ currentStep: step }),

      markStepCompleted: (step) =>
        set((state) => {
          if (state.completedSteps.includes(step)) return state;
          return { completedSteps: [...state.completedSteps, step] };
        }),

      setJadwalRows: (rows) => set({ jadwalRows: rows }),

      setTargetTerm: (term) => set({ targetTerm: term }),

      resetProgress: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: 'jadwal-onboard-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
