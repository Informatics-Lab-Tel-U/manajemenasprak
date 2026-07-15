import { getStats } from '@/services/databaseService';
import {
  getJadwalByTerm,
  getJadwalPengganti,
  getCachedAvailableTerms as fetchAvailableTerms,
} from '@/services/jadwalService';
import { getModulScheduleByTerm } from '@/services/modulScheduleService';
import DashboardClient from '@/components/DashboardClient';
import { requireAuth } from '@/lib/auth';

export const revalidate = 0;

export default async function Home() {
  const user = await requireAuth();

  // Fetch terms first so we can use the latest term for all other queries
  const initialTerms = await fetchAvailableTerms();
  const latestTerm = initialTerms[0] ?? '';

  // Get active modul based on current date (WIB)
  const nowUtc = new Date();
  const nowWib = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000);
  const todayStr = nowWib.toISOString().split('T')[0];

  const initialModuls = await getModulScheduleByTerm(latestTerm);
  const activeModul =
    initialModuls
      .filter((m) => m.tanggal_mulai && m.tanggal_mulai <= todayStr)
      .sort((a, b) => b.modul - a.modul)[0]?.modul || 1;

  const [initialStats, initialJadwal, initialPengganti] = await Promise.all([
    getStats(latestTerm),
    getJadwalByTerm(latestTerm),
    getJadwalPengganti(activeModul),
  ]);

  return (
    <div className="container mx-auto max-w-[2000px] 2xl:px-8">
      <DashboardClient
        initialStats={initialStats}
        initialJadwal={initialJadwal}
        initialPengganti={initialPengganti}
        initialTerms={initialTerms}
        activeModul={activeModul}
        userRole={user.pengguna.role}
      />
    </div>
  );
}
