import { useEffect } from 'react';
import { useMonitoringStore, HeartbeatPoint } from '@/store/useMonitoringStore';

export type { HeartbeatPoint };

export function useHeartbeatLogAll(range: string = '1h') {
  const heartbeatData = useMonitoringStore(state => state.heartbeatData);
  const init = useMonitoringStore(state => state.init);
  
  // Pastikan inisialisasi dijalankan (Aman dipanggil berkali-kali karena dijaga isInitialized)
  useEffect(() => {
    init();
  }, [init]);

  return heartbeatData;
}
