"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMonitoringStore, LabStatus } from '@/store/useMonitoringStore';
import { Activity, Computer, Users, AlertTriangle } from 'lucide-react';

const OFFLINE_THRESHOLD_S = 60;

interface MonitoringSummaryCardsProps {
  /** Data awal dari SSR — menghilangkan flash "0" di render pertama */
  initialData?: LabStatus[];
}

export function MonitoringSummaryCards({ initialData = [] }: MonitoringSummaryCardsProps) {
  const monitoringData = useMonitoringStore((s) => s.labStatus);
  const heartbeatData = useMonitoringStore((s) => s.heartbeatData);
  const init = useMonitoringStore((s) => s.init);
  const setInitialLabStatus = useMonitoringStore((s) => s.setInitialLabStatus);
  
  const [now, setNow] = useState(new Date());

  // Populate store dengan data SSR SEBELUM init() async selesai,
  // sehingga render pertama sudah memiliki data yang benar.
  useEffect(() => {
    if (initialData.length > 0) {
      setInitialLabStatus(initialData);
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer untuk refresh offline-status calculation.
  // 10 detik cukup — threshold offline adalah 60 detik.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(timer);
  }, []);

  // Memo 1: Bergantung pada monitoringData + now (aktif/offline).
  // Hanya re-compute saat ada update Realtime ATAU setiap 10 detik (timer).
  const { activeLabs, offlineLabs } = useMemo(() => {
    const active = monitoringData.filter(
      (d) => d.status !== 'offline' && (now.getTime() - new Date(d.last_seen).getTime()) / 1000 <= (OFFLINE_THRESHOLD_S + 30)
    );
    const offline = monitoringData.filter(
      (d) => d.status === 'offline' || (now.getTime() - new Date(d.last_seen).getTime()) / 1000 > (OFFLINE_THRESHOLD_S + 30)
    );
    return { activeLabs: active, offlineLabs: offline };
  }, [monitoringData, now]);

  // Memo 2: Bergantung hanya pada heartbeatData.
  // Re-compute HANYA saat ada heartbeat baru (WebSocket INSERT), tidak terpengaruh timer.
  const { avgLatency, highestSpike, spikeLab } = useMemo(() => {
    let totalLatency = 0;
    let count = 0;
    let highestSpike = 0;
    let spikeLab = "-";

    Object.entries(heartbeatData).forEach(([labId, points]) => {
      if (points.length === 0) return;

      const lastPoint = points[points.length - 1];
      if (lastPoint.response_time_ms !== null) {
        totalLatency += lastPoint.response_time_ms;
        count++;
      }

      points.forEach(p => {
        if (p.response_time_ms !== null && p.response_time_ms > highestSpike) {
          highestSpike = p.response_time_ms;
          spikeLab = labId;
        }
      });
    });

    return {
      avgLatency: count > 0 ? Math.round(totalLatency / count) : 0,
      highestSpike,
      spikeLab,
    };
  }, [heartbeatData]);

  // Memo 3: Gabungkan semua metric (sangat murah, hanya satu objek)
  const metrics = useMemo(() => {
    const uniqueClasses = new Set(activeLabs.map(l => l.kelas).filter(k => k && k !== '-'));
    const hasOffline = offlineLabs.length > 0;

    let anomalyText = "Semua koneksi stabil";
    let anomalyWarn = false;

    if (hasOffline) {
      anomalyText = `${offlineLabs.length} Lab Disconnect!`;
      anomalyWarn = true;
    } else if (highestSpike > 1000) {
      anomalyText = `Spike: ${highestSpike}ms (${spikeLab})`;
      anomalyWarn = true;
    }

    return {
      activeCount: activeLabs.length,
      totalCount: Math.max(monitoringData.length, 1),
      classCount: uniqueClasses.size,
      avgLatency,
      anomalyText,
      anomalyWarn,
    };
  }, [activeLabs, offlineLabs, avgLatency, highestSpike, spikeLab, monitoringData.length]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card className="@container/card bg-card shadow-sm">
        <CardHeader>
          <CardDescription>Total Lab Aktif</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.activeCount} / {metrics.totalCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Computer />
              {metrics.activeCount === metrics.totalCount ? "100%" : `${Math.round((metrics.activeCount / metrics.totalCount) * 100)}%`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Sinyal berjalan normal <Activity className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {metrics.activeCount} PC Lab merespons
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card bg-card shadow-sm">
        <CardHeader>
          <CardDescription>Sesi Praktikum</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.classCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Users />
              Aktif
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Kelas sedang berlangsung <Users className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Berdasarkan sesi aktif di PC
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card bg-card shadow-sm">
        <CardHeader>
          <CardDescription>Rata-rata Ping</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.avgLatency} <span className="text-lg">ms</span>
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={metrics.avgLatency < 500 ? "text-blue-500" : "text-orange-500"}>
              <Activity />
              {metrics.avgLatency < 500 ? "Good" : "Slow"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {metrics.avgLatency < 500 ? "Koneksi jaringan stabil" : "Koneksi jaringan melambat"} <Activity className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Rata-rata dari ping terakhir
          </div>
        </CardFooter>
      </Card>

      <Card className={`@container/card bg-card shadow-sm ${metrics.anomalyWarn ? 'border-destructive/50' : ''}`}>
        <CardHeader>
          <CardDescription>Status Anomali</CardDescription>
          <CardTitle className={`text-2xl font-semibold tabular-nums @[250px]/card:text-3xl ${metrics.anomalyWarn ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
            {metrics.anomalyWarn ? "Perhatian" : "Aman"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={metrics.anomalyWarn ? "border-destructive text-destructive" : ""}>
              <AlertTriangle />
              {metrics.anomalyWarn ? "Alert" : "OK"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium truncate w-full" title={metrics.anomalyText}>
            {metrics.anomalyText} <AlertTriangle className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Monitor anomali jaringan
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
