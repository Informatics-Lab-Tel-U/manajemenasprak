"use client"
import dynamic from 'next/dynamic';

const InteractiveHeartbeatChart = dynamic(
  () => import('@/components/monitoring/InteractiveHeartbeatChart').then((mod) => mod.InteractiveHeartbeatChart),
  { 
    ssr: false,
    loading: () => <div className="h-[480px] w-full animate-pulse bg-muted rounded-xl"></div>
  }
);

export function ClientHeartbeatChart() {
  return <InteractiveHeartbeatChart />;
}
