'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, MonitorOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { useMonitoringStore, LabStatus } from '@/store/useMonitoringStore';
import { ResponseTimeChart } from '@/components/monitoring/ResponseTimeChart';

const POLL_INTERVAL_MS = 20_000;
const RECONNECT_DELAY_MS = 5_000;
const OFFLINE_THRESHOLD_S = 60;

export default function RealtimeMonitoringList({ initialData }: { initialData: LabStatus[] }) {
  const monitoringData = useMonitoringStore(s => s.labStatus);
  const heartbeatHistory = useMonitoringStore(s => s.heartbeatData);
  const init = useMonitoringStore(s => s.init);
  const updateLabStatus = useMonitoringStore(s => s.updateLabStatus);
  const setInitialLabStatus = useMonitoringStore(s => s.setInitialLabStatus);

  const [now, setNow] = useState(new Date());

  // Init store with SSR data
  useEffect(() => {
    setInitialLabStatus(initialData);
    init();
  }, [initialData, setInitialLabStatus, init]);

  // Clock tick for local TTL calculation
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // === POLLING FALLBACK ===
  // Fetch via our own API route (uses admin client server-side, bypasses RLS).
  // This is the safety net: even if the Realtime channel dies silently,
  // the UI will never show stale data for more than 20 seconds.
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/monitoring/status');
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          updateLabStatus(json.data as LabStatus[]);
        }
      } catch {
        // network error — silently skip, Realtime will still handle updates
      }
    };

    const pollInterval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(pollInterval);
  }, [updateLabStatus]); // eslint-disable-line react-hooks/exhaustive-deps

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
