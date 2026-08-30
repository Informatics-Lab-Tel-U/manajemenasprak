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
  syncWithTerm: (term: string, isAlreadyDone?: boolean, dbJadwalList?: any[]) => void;
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

      syncWithTerm: (term, isAlreadyDone = false, dbJadwalList = []) => {
        const currentTargetTerm = get().targetTerm;
        const isDifferentTerm = currentTargetTerm !== term;
        const isRowsEmpty = get().jadwalRows.length === 0;

        const mappedRows: JadwalPreviewRow[] = (dbJadwalList || []).map((j: any, index: number) => ({
          id_mk: j.id_mk,
          kelas: j.kelas,
          hari: j.hari,
          sesi: j.sesi,
          jam: j.jam,
          ruangan: j.ruangan,
          total_asprak: j.total_asprak,
          dosen: j.dosen || '',
          status: 'ok',
          statusMessage: 'Sudah tersimpan di DB',
          mkName: j.mata_kuliah?.praktikum?.nama || j.mata_kuliah?.nama_lengkap || 'Mata Kuliah',
          fromSystemLogic: false,
          selected: true,
          originalRow: index + 1,
        }));

        if (isDifferentTerm) {
          set({
            targetTerm: term,
            completedSteps: isAlreadyDone ? ['upload', 'preview', 'selesai'] : [],
            jadwalRows: isAlreadyDone ? mappedRows : [],
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
              completedSteps: ['upload', 'preview', 'selesai'],
              jadwalRows: isRowsEmpty && mappedRows.length > 0 ? mappedRows : get().jadwalRows,
              targetTerm: term,
            });
          }
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
