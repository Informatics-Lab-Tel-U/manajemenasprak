import { InteractiveHeartbeatChart } from "@/components/monitoring/InteractiveHeartbeatChart";

export const metadata = {
  title: 'Interactive Monitoring | Manajemen Asprak',
};

export default function MonitorPage() {
  return (
    <div className="container mx-auto max-w-[2000px] 2xl:px-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Interactive Monitor</h2>
        <p className="text-muted-foreground mt-2">
          Detail riwayat response time untuk setiap PC Lab aktif.
        </p>
      </div>
      <InteractiveHeartbeatChart />
    </div>
  );
}
