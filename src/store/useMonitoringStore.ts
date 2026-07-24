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
    if (get().isInitialized) return; // Prevent multiple init
    
    // Tandai inisialisasi mulai berjalan
    set({ isInitialized: true });

    // 1. Fetch data historis heartbeat
    try {
      const res = await fetch(`/api/monitoring/heartbeat-log?range=1h`);
      if (res.ok) {
        const { data } = await res.json();
        if (data) {
          const grouped: Record<string, HeartbeatPoint[]> = {};
          data.forEach((log: any) => {
            if (!grouped[log.lab_id]) grouped[log.lab_id] = [];
            grouped[log.lab_id].push({
              created_at: log.created_at,
              response_time_ms: log.response_time_ms
            });
          });
          // Trim to max points
          Object.keys(grouped).forEach(labId => {
            if (grouped[labId].length > MAX_POINTS) {
              grouped[labId] = grouped[labId].slice(-MAX_POINTS);
            }
          });
          set({ heartbeatData: grouped });
        }
      }
    } catch (err) {
      console.error('Failed to fetch initial heartbeat logs:', err);
    }

    // 2. Fetch data lab status fallback (jika SSR belum mem-passing data)
    if (get().labStatus.length === 0) {
      try {
        const res = await fetch('/api/monitoring/status');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            set({ labStatus: json.data });
          }
        }
      } catch (err) {}
    }

    // 3. Setup WebSocket Subscription untuk monitoring_lab
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

    // 4. Setup WebSocket Subscription untuk monitoring_heartbeat_log
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
  },

  cleanup: () => {
    // Pada arsitektur SPA/Next.js, cleanup total channel bisa menyebabkan data stale 
    // jika user navigasi maju-mundur antar halaman dengan cepat.
    // Namun untuk kebersihan memori saat komponen inti di-unmount:
    if (channelLab) {
      supabase.removeChannel(channelLab);
      channelLab = null;
    }
    if (channelHeartbeat) {
      supabase.removeChannel(channelHeartbeat);
      channelHeartbeat = null;
    }
    set({ isInitialized: false });
  }
}));
