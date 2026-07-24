import { InteractiveHeartbeatChart } from "@/components/monitoring/InteractiveHeartbeatChart";

export const metadata = {
  title: 'Monitoring Lab | Manajemen Asprak',
};

export default function MonitoringPage() {
  return (
    <div className="container mx-auto max-w-[2000px] 2xl:px-8 space-y-6">
      <InteractiveHeartbeatChart />
    </div>
  );
}
