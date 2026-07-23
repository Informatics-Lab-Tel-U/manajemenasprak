'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, MonitorOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';

export type LabStatus = {
  lab_id: string;
  kelas: string;
  status: string;
  last_seen: string;
};

export default function RealtimeMonitoringList({ initialData }: { initialData: LabStatus[] }) {
  const [monitoringData, setMonitoringData] = useState<LabStatus[]>(initialData);
  const [now, setNow] = useState(new Date());
  const supabase = createClient();

  // Update current time every second to calculate TTL locally
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to Supabase Realtime for UPSERTS on monitoring_lab table
  useEffect(() => {
    const channel = supabase
      .channel('monitoring_updates')
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
  }, [supabase]);

  if (monitoringData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 rounded-lg border border-dashed">
        <MonitorOff className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Belum Ada Data Lab</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Sistem belum menerima sinyal *heartbeat* dari PC Lab manapun. Pastikan Generator Kursi sedang dibuka di PC Lab yang telah dikonfigurasi.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 2xl:gap-8">
      {monitoringData.map((data) => {
        const lastSeenTime = new Date(data.last_seen);
        // TTL Logic: If last seen was more than 150 seconds ago, consider it offline.
        const diffInSeconds = (now.getTime() - lastSeenTime.getTime()) / 1000;
        const isOnline = diffInSeconds <= 150;

        return (
          <Card key={data.lab_id} className={`overflow-hidden transition-all duration-200 ${isOnline ? 'border-green-500/50 shadow-sm shadow-green-100 dark:shadow-none' : 'opacity-70'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xl font-bold">
                {data.lab_id}
              </CardTitle>
              <Activity className={`h-5 w-5 ${isOnline ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  {isOnline ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
                      🟢 Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive dark:bg-destructive/20">
                      🔴 Offline
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Kelas Aktif</span>
                  <span className="text-sm font-bold bg-muted px-2 py-1 rounded">
                    {isOnline ? data.kelas : '-'}
                  </span>
                </div>

                <div className="text-xs text-right text-muted-foreground mt-2">
                  Detak terakhir: {formatDistanceToNow(lastSeenTime, { addSuffix: true, locale: id })}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
