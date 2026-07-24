import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MonitoringHeartbeatLog } from '@/types/database';

export type HeartbeatPoint = {
  created_at: string;
  response_time_ms: number | null;
};

const MAX_POINTS = 60; // 60 points per lab ~ 20 minutes if interval is 20s

export function useHeartbeatLogAll(range: string = '1h') {
  const [dataByLab, setDataByLab] = useState<Record<string, HeartbeatPoint[]>>({});
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    let isMounted = true;
    
    const fetchInitialData = async () => {
      try {
        const res = await fetch(`/api/monitoring/heartbeat-log?range=${range}`);
        if (!res.ok) return;
        const { data } = await res.json();
        
        if (isMounted && data) {
          const grouped: Record<string, HeartbeatPoint[]> = {};
          
          (data as MonitoringHeartbeatLog[]).forEach((log) => {
            if (!grouped[log.lab_id]) {
              grouped[log.lab_id] = [];
            }
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

          setDataByLab(grouped);
        }
      } catch (err) {
        console.error('Failed to fetch initial heartbeat logs:', err);
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [range]);

  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel('monitoring_heartbeat_log_updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'monitoring_heartbeat_log' },
        (payload) => {
          const newLog = payload.new as MonitoringHeartbeatLog;
          
          setDataByLab(prev => {
            const labId = newLog.lab_id;
            const currentList = prev[labId] || [];
            
            const updatedList = [
              ...currentList, 
              { 
                created_at: newLog.created_at, 
                response_time_ms: newLog.response_time_ms 
              }
            ];
            
            // Keep array size capped
            if (updatedList.length > MAX_POINTS) {
              updatedList.shift();
            }
            
            return {
              ...prev,
              [labId]: updatedList
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return dataByLab;
}
