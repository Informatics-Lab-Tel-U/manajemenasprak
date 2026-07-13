import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface TermState {
  activeTerm: string | null;
  setActiveTerm: (term: string) => void;
}

export const useTermStore = create<TermState>()(
  persist(
    (set) => ({
      activeTerm: null,
      setActiveTerm: (term) => set({ activeTerm: term }),
    }),
    {
      name: 'term-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
