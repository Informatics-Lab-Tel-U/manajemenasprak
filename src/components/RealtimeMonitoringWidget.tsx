'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { ROOMS } from '@/constants';
import { LabStatus } from '@/app/(dashboard)/monitoring/RealtimeMonitoringList';
import Link from 'next/link';

const POLL_INTERVAL_MS = 20_000;
const RECONNECT_DELAY_MS = 5_000;
const OFFLINE_THRESHOLD_S = 60;

export default function RealtimeMonitoringWidget({ initialData }: { initialData: LabStatus[] }) {
  const [monitoringData, setMonitoringData] = useState<LabStatus[]>(initialData);
  const [now, setNow] = useState(new Date());
  const supabaseRef = useRef(createClient());

  // Clock tick for local TTL calculation
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // === POLLING FALLBACK ===
  // Fetch via our own API route (uses admin client server-side, bypasses RLS).
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/monitoring/status');
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          setMonitoringData(json.data as LabStatus[]);
        }
      } catch {
        // network error — silently skip, Realtime will still handle updates
      }
    };

    const pollInterval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(pollInterval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // === SUPABASE REALTIME (PRIMARY PUSH) ===
  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel('monitoring_updates_overview')
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
          console.warn('[Realtime:Widget] Channel issue:', status, err ?? '— Supabase will auto-reconnect');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeLabsCount = monitoringData.filter(
    (d) => (now.getTime() - new Date(d.last_seen).getTime()) / 1000 <= OFFLINE_THRESHOLD_S
  ).length;

  return (
    <Card className="w-full transition-all duration-300 border bg-card hover:border-foreground/20 shadow-sm border-blue-200/50 dark:border-blue-500/20 mb-6">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full flex-1">
          <div className="shrink-0">
            <CardTitle className="flex items-center gap-2">
              Track Ruangan
            </CardTitle>
          </div>

          <div className="flex flex-row items-center gap-2 sm:border-l sm:pl-6 min-h-[30px] w-full flex-1 overflow-x-auto scrollbar-thin pb-2 sm:pb-0">
            {ROOMS.map((room) => {
              const data = monitoringData.find(
                (d) => d.lab_id.replace(/\s+/g, '') === room.replace(/\s+/g, '')
              );
              let isOnline = false;
              if (data) {
                const diffInSeconds = (now.getTime() - new Date(data.last_seen).getTime()) / 1000;
                isOnline = diffInSeconds <= OFFLINE_THRESHOLD_S;
              }

              return (
                <div
                  key={room}
                  className={`flex flex-col items-start justify-center gap-1 rounded-md px-3 py-2 text-sm font-semibold shadow-sm border transition-colors grow shrink-0 min-w-[120px] h-full ${
                    isOnline
                      ? 'bg-card border-green-200 dark:border-green-900'
                      : 'bg-muted/30 border-border opacity-70'
                  }`}
                  title={isOnline ? `Online (Kelas: ${data?.kelas || 'N/A'})` : 'Offline'}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${isOnline ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                    <span className="whitespace-nowrap">{room}</span>
                  </div>
                  <span className="text-[10px] leading-none font-normal text-muted-foreground truncate w-full">
                    {isOnline ? (data?.kelas || 'Tidak ada sesi') : 'Offline'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-auto">
          <Link href="/monitoring">Lihat Detail</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
