'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Server } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { LabStatus } from '@/app/(dashboard)/monitoring/RealtimeMonitoringList';
import Link from 'next/link';

export default function RealtimeMonitoringWidget({ initialData }: { initialData: LabStatus[] }) {
  const [monitoringData, setMonitoringData] = useState<LabStatus[]>(initialData);
  const [now, setNow] = useState(new Date());
  // Use a ref so the supabase instance is stable across renders and never
  // triggers the subscription useEffect to re-run/disconnect.
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Dependency array is intentionally empty — we only want to subscribe once on mount.
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
            } else {
              return [...prev, updatedRow].sort((a, b) => a.lab_id.localeCompare(b.lab_id));
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeLabsCount = monitoringData.filter(
    (d) => (now.getTime() - new Date(d.last_seen).getTime()) / 1000 <= 60
  ).length;

  return (
    <Card className="relative overflow-hidden transition-all duration-300 group border bg-card hover:border-foreground/20 shadow-sm border-blue-200/50 dark:border-blue-500/20 mb-6">
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-[0.15] dark:opacity-10 pointer-events-none transition-opacity group-hover:opacity-30 from-blue-500 to-cyan-500 bg-gradient-to-br" />

      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="rounded-md p-2.5 shrink-0 shadow-sm text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-500/20">
            <Server size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground/90 dark:text-foreground">
                Konektivitas Lab
              </h3>
              {activeLabsCount > 0 ? (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium opacity-80 mt-0.5">
              {activeLabsCount} Lab terhubung secara real-time
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl px-2">
          {monitoringData.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">Belum ada data lab</span>
          ) : (
            monitoringData.map((data) => {
              const diffInSeconds = (now.getTime() - new Date(data.last_seen).getTime()) / 1000;
              const isOnline = diffInSeconds <= 60;

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

        <Link
          href="/monitoring"
          className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
        >
          Lihat Detail
          <Activity size={14} className="animate-pulse" />
        </Link>
      </CardContent>
    </Card>
  );
}
