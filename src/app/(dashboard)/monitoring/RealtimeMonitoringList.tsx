'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, MonitorOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import { useHeartbeatLogAll } from '@/hooks/useHeartbeatLog';
import { ResponseTimeChart } from '@/components/monitoring/ResponseTimeChart';

export type LabStatus = {
  lab_id: string;
  kelas: string;
  status: string;
  last_seen: string;
};

const POLL_INTERVAL_MS = 20_000;
const RECONNECT_DELAY_MS = 5_000;
const OFFLINE_THRESHOLD_S = 60;

export default function RealtimeMonitoringList({ initialData }: { initialData: LabStatus[] }) {
  const [monitoringData, setMonitoringData] = useState<LabStatus[]>(initialData);
  const [now, setNow] = useState(new Date());
  const supabaseRef = useRef(createClient());
  const heartbeatHistory = useHeartbeatLogAll('1h');

  // Clock tick for local TTL calculation
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // === POLLING FALLBACK DIBUANG ===
  // Karena akun Cloudflare menggunakan Free Tier Shared (100k limit)
  // Polling setiap 20 detik sangat boros kuota request. 
  // Sekarang aplikasi 100% mengandalkan SSR (initialData) & Supabase Realtime via WebSocket 
  // (yang tidak memotong kuota Workers).

  // === SUPABASE REALTIME (PRIMARY PUSH) ===
  // Realtime delivers instant updates on INSERT/UPDATE.
  // Supabase client automatically handles reconnection on errors/timeouts.
  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel('monitoring_updates_lab')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monitoring_lab' },
        (payload) => {
          setMonitoringData((prev) => {
            const updatedRow = payload.new as LabStatus;
            const existingIndex = prev.findIndex((item) => item.lab_id === updatedRow.lab_id);
            if (existingIndex !== -1) {
              const newData = [...prev];
              newData[existingIndex] = updatedRow;
              return newData.sort((a, b) => a.lab_id.localeCompare(b.lab_id));
            }
            return [...prev, updatedRow].sort((a, b) => a.lab_id.localeCompare(b.lab_id));
          });
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[Realtime:List] Channel issue:', status, err ?? '— Supabase will auto-reconnect');
        } else if (status === 'SUBSCRIBED') {
          console.log('[Realtime:List] Connected to Realtime');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (monitoringData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 rounded-lg border border-dashed">
        <MonitorOff className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Belum Ada Data Lab</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Sistem belum menerima sinyal heartbeat dari PC Lab manapun. Pastikan Generator Kursi sedang dibuka di PC Lab yang telah dikonfigurasi.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6 2xl:gap-8">
      {monitoringData.map((data) => {
        const lastSeenTime = new Date(data.last_seen);
        const diffInSeconds = (now.getTime() - lastSeenTime.getTime()) / 1000;
        const isOnline = diffInSeconds <= OFFLINE_THRESHOLD_S;

        const labHistory = heartbeatHistory[data.lab_id] || [];
        const lastResponseTime = labHistory.length > 0 ? labHistory[labHistory.length - 1].response_time_ms : null;
        const isSpike = lastResponseTime !== null && lastResponseTime > 800;

        return (
          <Card key={data.lab_id} className={`overflow-hidden transition-all duration-200 ${isOnline ? 'border-green-500/50 shadow-sm shadow-green-100 dark:shadow-none' : 'opacity-70'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-bold">{data.lab_id}</CardTitle>
              <Activity className={`h-5 w-5 ${isOnline ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  {isOnline ? (
                    <div className="flex items-center gap-2">
                      {lastResponseTime !== null && (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${isSpike ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                          {lastResponseTime}ms
                        </span>
                      )}
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
                        Online
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive dark:bg-destructive/20">
                      Offline
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground shrink-0">Kelas Aktif</span>
                  <span 
                    className="text-sm font-bold bg-muted px-2 py-1 rounded truncate max-w-[150px] sm:max-w-[200px] text-right"
                    title={isOnline ? data.kelas : '-'}
                  >
                    {isOnline ? data.kelas : '-'}
                  </span>
                </div>

                <div className="text-xs text-right text-muted-foreground mt-2">
                  Detak terakhir: {formatDistanceToNow(lastSeenTime, { addSuffix: true, locale: id })}
                </div>
                
                {isOnline && labHistory.length > 0 && (
                  <ResponseTimeChart data={labHistory} compact />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
