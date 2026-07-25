import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export type LabStatus = {
  lab_id: string;
  kelas: string;
  status: string;
  last_seen: string;
};

export type HeartbeatPoint = {
  created_at: string;
  response_time_ms: number | null;
};

const MAX_POINTS = 60; // 60 points per lab ~ 20 menit jika interval 20s

interface MonitoringState {
  labStatus: LabStatus[];
  heartbeatData: Record<string, HeartbeatPoint[]>;
  isInitialized: boolean;
  init: () => void;
  cleanup: () => void;
  setInitialLabStatus: (data: LabStatus[]) => void;
  updateLabStatus: (data: LabStatus[]) => void;
}

// Client global untuk websocket, disimpan di luar React lifecycle
const supabase = createClient();
let channelLab: ReturnType<typeof supabase.channel> | null = null;
let channelHeartbeat: ReturnType<typeof supabase.channel> | null = null;
// Mutex: menjamin init() hanya berjalan satu kali meskipun dipanggil secara bersamaan
let initPromise: Promise<void> | null = null;


let pollingTimer: NodeJS.Timeout | null = null;

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
  labStatus: [],
  heartbeatData: {},
  isInitialized: false,

  setInitialLabStatus: (data) => {
    // Hanya set jika labStatus masih kosong agar tidak me-reset data realtime yang sudah jalan
    if (get().labStatus.length === 0) {
      set({ labStatus: data });
    }
  },

  updateLabStatus: (data) => {
    // Paksa update (berguna untuk polling fallback)
    set({ labStatus: data });
  },

  init: async () => {
    // Mutex: kembalikan promise yang sama jika init sedang berjalan atau sudah selesai
    if (initPromise) return initPromise;
    
    initPromise = (async () => {
      set({ isInitialized: true });

      const fetchStatus = async () => {
        try {
          const res = await fetch('/api/monitoring/status');
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.data) && json.data.length > 0) {
              set({ labStatus: json.data });
            }
          }
        } catch (err) {}
      };

      // Initial fetch jika data masih kosong
      if (get().labStatus.length === 0) {
        await fetchStatus();
      }

      // Setup Polling Fallback setiap 15 detik (menjamin data selalu segar meski WebSocket delay)
      if (!pollingTimer) {
        pollingTimer = setInterval(fetchStatus, 15_000);
      }

      // Setup WebSocket Subscription untuk monitoring_lab
      if (!channelLab) {
      channelLab = supabase
        .channel('global_monitoring_lab')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'monitoring_lab' },
          (payload) => {
            const updatedRow = payload.new as LabStatus;
            set((state) => {
              const existingIndex = state.labStatus.findIndex((item) => item.lab_id === updatedRow.lab_id);
              if (existingIndex !== -1) {
                const newData = [...state.labStatus];
                newData[existingIndex] = updatedRow;
                return { labStatus: newData.sort((a, b) => a.lab_id.localeCompare(b.lab_id)) };
              }
              return { labStatus: [...state.labStatus, updatedRow].sort((a, b) => a.lab_id.localeCompare(b.lab_id)) };
            });
          }
        )
        .subscribe((status, err) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[Realtime:Store] Lab Channel issue:', status, err);
          }
        });
    }

      // Setup WebSocket Subscription untuk monitoring_heartbeat_log
      if (!channelHeartbeat) {
      channelHeartbeat = supabase
        .channel('global_monitoring_heartbeat')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'monitoring_heartbeat_log' },
          (payload) => {
            const newLog = payload.new as any;
            set((state) => {
              const labId = newLog.lab_id;
              const currentList = state.heartbeatData[labId] || [];
              const updatedList = [
                ...currentList, 
                { created_at: newLog.created_at, response_time_ms: newLog.response_time_ms }
              ];
              
              if (updatedList.length > MAX_POINTS) {
                updatedList.shift();
              }
              
              return {
                heartbeatData: {
                  ...state.heartbeatData,
                  [labId]: updatedList
                }
              };
            });
          }
        )
        .subscribe((status, err) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[Realtime:Store] Heartbeat Channel issue:', status, err);
          }
        });
    }
    })();
    
    return initPromise;
  },

  cleanup: () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
    if (channelLab) {
      supabase.removeChannel(channelLab);
      channelLab = null;
    }
    if (channelHeartbeat) {
      supabase.removeChannel(channelHeartbeat);
      channelHeartbeat = null;
    }
    initPromise = null;
    set({ isInitialized: false });
  }
}));
