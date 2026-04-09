import { getStats } from '@/services/databaseService';
import {
  getTodaySchedule,
  getCachedAvailableTerms as fetchAvailableTerms,
} from '@/services/jadwalService';
import DashboardClient from '@/components/DashboardClient';
import { requireAuth } from '@/lib/auth';

export const revalidate = 0;

export default async function Home() {
  const user = await requireAuth();
  
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
        userRole={user.pengguna.role}
      />
    </div>
  );
}
