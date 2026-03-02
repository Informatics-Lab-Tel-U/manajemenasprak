import { getStats } from '@/services/server/databaseService';
import { getTodaySchedule, fetchAvailableTerms } from '@/services/server/jadwalService';
import DashboardClient from '@/components/DashboardClient';

export const revalidate = 0;

export default async function Home() {
  // Fetch terms first so we can use the latest term for all other queries
  const initialTerms = await fetchAvailableTerms();
  const latestTerm = initialTerms[0] ?? '';

  const [initialStats, initialSchedule] = await Promise.all([
    getStats(latestTerm),
    getTodaySchedule(100, latestTerm),
  ]);

  return (
    <div className="container">
      <DashboardClient 
        initialStats={initialStats}
        initialSchedule={initialSchedule}
        initialTerms={initialTerms}
      />
    </div>
  );
}
