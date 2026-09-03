import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { PresensiJaga } from '@/types/database';

interface PresensiJagaState {
  todayPresensi: PresensiJaga[];
  isInitialized: boolean;
  init: (initialData?: PresensiJaga[]) => Promise<void>;
  setInitialPresensi: (data: PresensiJaga[]) => void;
  cleanup: () => void;
  getPresensiForAsprak: (idAsprak: string, shift?: number) => PresensiJaga | undefined;
}

const supabase = createClient();
let channelPresensi: ReturnType<typeof supabase.channel> | null = null;
let initPromise: Promise<void> | null = null;

export const usePresensiJagaStore = create<PresensiJagaState>((set, get) => ({
  todayPresensi: [],
  isInitialized: false,

  setInitialPresensi: (data) => {
    if (get().todayPresensi.length === 0 && data && data.length > 0) {
      set({ todayPresensi: data });
    }
  },

  init: async (initialData) => {
    if (initialData && initialData.length > 0 && get().todayPresensi.length === 0) {
      set({ todayPresensi: initialData });
    }

    if (initPromise) return initPromise;

    initPromise = (async () => {
      set({ isInitialized: true });

      const fetchToday = async () => {
        try {
          const res = await fetch('/api/jaga/presensi/today');
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.data) && json.data.length > 0) {
              set({ todayPresensi: json.data });
            }
          }
        } catch (e) {
          console.warn('[Realtime:Presensi] Fetch today fallback error:', e);
        }
      };

      await fetchToday();

      if (!channelPresensi) {
        channelPresensi = supabase
          .channel('global_presensi_jaga')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'presensi_jaga' },
            async (payload) => {
              if (payload.eventType === 'INSERT') {
                const newRow = payload.new as PresensiJaga;
                
                // Jika data asprak relasi belum ada di payload raw CDC, ambil atau lengkapi
                set((state) => {
                  const existingIdx = state.todayPresensi.findIndex(p => p.id === newRow.id);
                  if (existingIdx !== -1) {
                    const copy = [...state.todayPresensi];
                    copy[existingIdx] = { ...copy[existingIdx], ...newRow };
                    return { todayPresensi: copy };
                  }
                  return { todayPresensi: [newRow, ...state.todayPresensi] };
                });
                
                fetchToday();
              } else if (payload.eventType === 'UPDATE') {
                const updatedRow = payload.new as PresensiJaga;
                set((state) => ({
                  todayPresensi: state.todayPresensi.map(item =>
                    item.id === updatedRow.id ? { ...item, ...updatedRow } : item
                  )
                }));
              } else if (payload.eventType === 'DELETE') {
                const oldRow = payload.old as { id: string };
                set((state) => ({
                  todayPresensi: state.todayPresensi.filter(item => item.id !== oldRow.id)
                }));
              }
            }
          )
          .subscribe((status, err) => {
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn('[Realtime:Presensi] Channel issue:', status, err);
            }
          });
      }
    })();

    return initPromise;
  },

  cleanup: () => {
    if (channelPresensi) {
      supabase.removeChannel(channelPresensi);
      channelPresensi = null;
    }
    initPromise = null;
    set({ isInitialized: false });
  },

  getPresensiForAsprak: (idAsprak: string, shift?: number) => {
    const list = get().todayPresensi;
    if (typeof shift === 'number') {
      return list.find(p => p.id_asprak === idAsprak && p.shift === shift);
    }
    return list.find(p => p.id_asprak === idAsprak);
  }
}));
