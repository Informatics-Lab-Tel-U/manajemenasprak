import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type OnboardingStep = 'praktikum' | 'matkul' | 'jadwal' | 'selesai';

export interface PraktikumDraft {
  id?: string;
  nama: string;
  tahun_ajaran: string;
}

export interface MataKuliahDraft {
  id?: string;
  nama_lengkap: string;
  program_studi: string;
  dosen_koor?: string;
  id_praktikum?: string;
}

export type OnboardingMode = 'manual' | 'copy';

export interface OnboardingDraft {
  praktikumList: (PraktikumDraft & { tempId: string })[];
  mataKuliahData: MataKuliahDraft[];
  mode?: OnboardingMode;
  targetTerm?: string;
  copySourceTerm?: string;
  copyOptions?: {
    copyPraktikum: boolean;
    copyMataKuliah: boolean;
  };
}

export interface OnboardingProgress {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  startedAt: string | null;
  lastUpdated: string | null;
}

interface OnboardingState extends OnboardingProgress {
  draft: OnboardingDraft;
  isDirty: boolean;
  
  // Actions
  setCurrentStep: (step: OnboardingStep) => void;
  markStepCompleted: (step: OnboardingStep) => void;
  unmarkStepCompleted: (step: OnboardingStep) => void;
  
  // Draft actions
  setPraktikumList: (data: (PraktikumDraft & { tempId: string })[]) => void;
  setMataKuliahList: (data: MataKuliahDraft[]) => void;
  addMataKuliahDraft: (data: MataKuliahDraft) => void;
  removeMataKuliahDraft: (index: number) => void;
  clearMataKuliahDraft: () => void;
  setCopySourceTerm: (term: string | undefined) => void;
  setCopyOptions: (options: OnboardingDraft['copyOptions']) => void;
  setMode: (mode: OnboardingMode) => void;
  setTargetTerm: (term: string | undefined) => void;
  
  // State actions
  setIsDirty: (dirty: boolean) => void;
  resetProgress: () => void;
  
  // Utility
  isStepCompleted: (step: OnboardingStep) => boolean;
  canProceedToStep: (step: OnboardingStep) => boolean;
  getProgressPercentage: () => number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STEP_ORDER: OnboardingStep[] = ['praktikum', 'matkul', 'jadwal', 'selesai'];

const INITIAL_STATE: OnboardingProgress & { draft: OnboardingDraft; isDirty: boolean } = {
  currentStep: 'praktikum',
  completedSteps: [],
  startedAt: null,
  lastUpdated: null,
  draft: {
    praktikumList: [],
    mataKuliahData: [],
  },
  isDirty: false,
};

// ============================================================================
// STORE
// ============================================================================

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // Step navigation
      setCurrentStep: (step) =>
        set((state) => {
          const now = new Date().toISOString();
          return {
            currentStep: step,
            startedAt: state.startedAt || now,
            lastUpdated: now,
          };
        }),

      markStepCompleted: (step) =>
        set((state) => {
          if (state.completedSteps.includes(step)) return state;
          const now = new Date().toISOString();
          return {
            completedSteps: [...state.completedSteps, step],
            lastUpdated: now,
          };
        }),

      unmarkStepCompleted: (step) =>
        set((state) => {
          const now = new Date().toISOString();
          return {
            completedSteps: state.completedSteps.filter((s) => s !== step),
            lastUpdated: now,
          };
        }),

      // Draft actions
      setPraktikumList: (data) =>
        set((state) => {
          const now = new Date().toISOString();
          return {
            draft: { ...state.draft, praktikumList: data },
            isDirty: true,
            lastUpdated: now,
          };
        }),

      setMataKuliahList: (data) =>
        set((state) => {
          const now = new Date().toISOString();
          return {
            draft: { ...state.draft, mataKuliahData: data },
            isDirty: true,
            lastUpdated: now,
          };
        }),

      addMataKuliahDraft: (data) =>
        set((state) => {
          const now = new Date().toISOString();
          return {
            draft: {
              ...state.draft,
              mataKuliahData: [...state.draft.mataKuliahData, data],
            },
            isDirty: true,
            lastUpdated: now,
          };
        }),

      removeMataKuliahDraft: (index) =>
        set((state) => {
          const now = new Date().toISOString();
          return {
            draft: {
              ...state.draft,
              mataKuliahData: state.draft.mataKuliahData.filter((_, i) => i !== index),
            },
            isDirty: true,
            lastUpdated: now,
          };
        }),

      clearMataKuliahDraft: () =>
        set((state) => ({
          draft: { ...state.draft, mataKuliahData: [] },
        })),

      setCopySourceTerm: (term) =>
        set((state) => ({
          draft: { ...state.draft, copySourceTerm: term },
        })),

      setCopyOptions: (options) =>
        set((state) => ({
          draft: { ...state.draft, copyOptions: options },
        })),

      setMode: (mode) =>
        set((state) => ({
          draft: { ...state.draft, mode },
        })),

      setTargetTerm: (term) =>
        set((state) => ({
          draft: { ...state.draft, targetTerm: term },
        })),

      // State actions
      setIsDirty: (dirty) => set({ isDirty: dirty }),

      resetProgress: () =>
        set({
          ...INITIAL_STATE,
          startedAt: null,
          lastUpdated: null,
        }),

      // Utility functions
      isStepCompleted: (step) => {
        const state = get();
        return state.completedSteps.includes(step);
      },

      canProceedToStep: (step) => {
        const state = get();
        const stepIndex = STEP_ORDER.indexOf(step);
        
        // Can always go to first step
        if (stepIndex === 0) return true;
        
        // Check if all previous steps are completed
        const completedSet = new Set(state.completedSteps);
        for (let i = 0; i < stepIndex; i++) {
          if (!completedSet.has(STEP_ORDER[i])) {
            return false;
          }
        }
        
        return true;
      },

      getProgressPercentage: () => {
        const state = get();
        const completedCount = state.completedSteps.filter((s) => s !== 'selesai').length;
        const totalSteps = STEP_ORDER.length - 1; // Exclude 'selesai' from total
        return Math.round((completedCount / totalSteps) * 100);
      },
    }),
    {
      name: 'onboarding-progress',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        startedAt: state.startedAt,
        lastUpdated: state.lastUpdated,
        draft: {
          ...state.draft,
          praktikumList: [],
          mataKuliahData: [],
        },
      }),
    }
  )
);

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook untuk mendapatkan status step
 */
export function useStepStatus(step: OnboardingStep): 'completed' | 'active' | 'inactive' | 'blocked' {
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const completedSteps = useOnboardingStore((s) => s.completedSteps);
  const canProceedToStep = useOnboardingStore((s) => s.canProceedToStep);

  if (completedSteps.includes(step)) return 'completed';
  if (currentStep === step) return 'active';
  if (!canProceedToStep(step)) return 'blocked';
  return 'inactive';
}

/**
 * Hook untuk autosave indicator
 */
export function useAutosaveStatus() {
  const lastUpdated = useOnboardingStore((s) => s.lastUpdated);
  const isDirty = useOnboardingStore((s) => s.isDirty);

  return {
    lastSaved: lastUpdated ? new Date(lastUpdated) : null,
    isDirty,
    hasDraft: (useOnboardingStore.getState().draft.praktikumList?.length || 0) > 0 || 
               (useOnboardingStore.getState().draft.mataKuliahData?.length || 0) > 0,
  };
}

/**
 * Hook untuk check apakah ada unsaved changes
 */
export function useHasUnsavedChanges() {
  return useOnboardingStore((s) => s.isDirty);
}

/**
 * Hook untuk mendapatkan ringkasan draft
 */
export function useOnboardingDraftSummary() {
  const draft = useOnboardingStore((s) => s.draft);
  const completedSteps = useOnboardingStore((s) => s.completedSteps);
  const progressPercentage = useOnboardingStore((s) => s.getProgressPercentage);

  return {
    hasPraktikum: (draft.praktikumList?.length || 0) > 0,
    praktikumCount: draft.praktikumList?.length || 0,
    mataKuliahCount: draft.mataKuliahData?.length || 0,
    hasCopySource: !!draft.copySourceTerm,
    copySourceTerm: draft.copySourceTerm,
    completedStepsCount: completedSteps.length,
    progressPercentage: progressPercentage(),
  };
}
