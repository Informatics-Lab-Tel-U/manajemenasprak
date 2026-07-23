'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
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

  // === SUPABASE REALTIME (PRIMARY PUSH) + AUTO-RECONNECT ===
  useEffect(() => {
    const supabase = supabaseRef.current;
    let channel: RealtimeChannel;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const subscribe = () => {
      channel = supabase
        .channel(`monitoring_updates_overview_${Date.now()}`)
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
          // Only reconnect on unexpected errors, NOT on CLOSED.
          // CLOSED fires when we call removeChannel ourselves, causing an infinite loop.
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[Realtime:Widget] Channel down:', status, err ?? '— reconnecting…');
            reconnectTimer = setTimeout(() => {
              supabase.removeChannel(channel);
              subscribe();
            }, RECONNECT_DELAY_MS);
          }
        });
    };

    subscribe();

    return () => {
      clearTimeout(reconnectTimer);
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeLabsCount = monitoringData.filter(
    (d) => (now.getTime() - new Date(d.last_seen).getTime()) / 1000 <= OFFLINE_THRESHOLD_S
  ).length;

  return (
    <Card className="transition-all duration-300 border bg-card hover:border-foreground/20 shadow-sm border-blue-200/50 dark:border-blue-500/20 mb-6">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="space-y-1.5 shrink-0">
            <CardTitle className="flex items-center gap-2">
              Konektivitas Lab
              {activeLabsCount > 0 ? (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
              )}
            </CardTitle>
            <CardDescription>
              {activeLabsCount} Lab terhubung secara real-time
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:border-l sm:pl-6 min-h-[30px]">
            {monitoringData.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">Belum ada data lab</span>
            ) : (
              monitoringData.map((data) => {
                const diffInSeconds = (now.getTime() - new Date(data.last_seen).getTime()) / 1000;
                const isOnline = diffInSeconds <= OFFLINE_THRESHOLD_S;

                return (
                  <div
                    key={data.lab_id}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm border transition-colors ${
                      isOnline
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20'
                        : 'bg-muted/50 text-muted-foreground border-transparent opacity-70'
                    }`}
                    title={isOnline ? `Online (Kelas: ${data.kelas})` : 'Offline'}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                    {data.lab_id}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-auto">
          <Link href="/monitoring">Lihat Detail</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
