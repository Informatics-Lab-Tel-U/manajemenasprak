import { getStats } from '@/services/databaseService';
import {
  getJadwalByTerm,
  getJadwalPengganti,
  getCachedAvailableTerms as fetchAvailableTerms,
} from '@/services/jadwalService';
import { getModulScheduleByTerm } from '@/services/modulScheduleService';
import DashboardClient from '@/components/DashboardClient';
import { requireAuth } from '@/lib/auth';
import { getMonitoringLabs } from '@/services/monitoringService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const user = await requireAuth();

  let initialTerms: string[] = [];
  let latestTerm = '';
  let activeModul = 1;
  let initialStats: any = null;
  let initialJadwal: any[] = [];
  let initialPengganti: any[] = [];
  let initialMonitoringData: any[] = [];

  try {
    const nowUtc = new Date();
    const nowWib = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000);
    const todayStr = nowWib.toISOString().split('T')[0];

    const [termsRes, modulsRes, statsRes, jadwalRes, penggantiRes, monitoringRes] = await Promise.all([
      fetchAvailableTerms(),
      getModulScheduleByTerm('all'),
      getStats('all'),
      getJadwalByTerm('all'),
      getJadwalPengganti(1),
      getMonitoringLabs(),
    ]);

    initialTerms = termsRes || [];
    const initialModuls = modulsRes || [];
    activeModul =
      initialModuls
        .filter((m) => m.tanggal_mulai && m.tanggal_mulai <= todayStr)
        .sort((a, b) => b.modul - a.modul)[0]?.modul || 1;

    initialStats = statsRes;
    initialJadwal = jadwalRes || [];
    initialPengganti = penggantiRes || [];
    initialMonitoringData = monitoringRes || [];
  } catch (error) {
    console.error('[Home Dashboard] SSR data fetching error:', error);
  }

  return (
    <div className="container mx-auto max-w-[2000px] 2xl:px-8">
      <DashboardClient
        initialStats={initialStats}
        initialJadwal={initialJadwal}
        initialPengganti={initialPengganti}
        initialTerms={initialTerms}
        activeModul={activeModul}
        userRole={user.pengguna.role}
        initialMonitoringData={initialMonitoringData}
      />
    </div>
  );
}
