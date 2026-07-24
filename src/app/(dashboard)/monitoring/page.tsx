import { ClientHeartbeatChart } from "@/components/monitoring/ClientHeartbeatChart";
import { MonitoringSummaryCards } from "@/components/monitoring/MonitoringSummaryCards";
import { getMonitoringLabs } from "@/services/monitoringService";

export const metadata = {
  title: 'Monitoring Lab | Manajemen Asprak',
};

export default async function MonitoringPage() {
  // Fetch SSR: data langsung tersedia saat render pertama, tidak ada flash of "0"
  // Dibungkus try-catch: jika gagal di Cloudflare Workers runtime, fallback ke []
  // agar tidak memicu Error 1101 (Worker threw exception)
  let initialLabStatus: Awaited<ReturnType<typeof getMonitoringLabs>> = [];
  try {
    initialLabStatus = await getMonitoringLabs();
  } catch (e) {
    console.error('[MonitoringPage] SSR getMonitoringLabs failed, using empty fallback:', e);
  }

  return (
    <div className="container mx-auto max-w-[2000px] 2xl:px-8">
      <MonitoringSummaryCards initialData={initialLabStatus} />
      <ClientHeartbeatChart />
    </div>
  );
}
