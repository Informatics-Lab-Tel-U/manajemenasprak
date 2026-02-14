import { getStats } from '@/services/server/databaseService';
import { getTodaySchedule, fetchAvailableTerms } from '@/services/server/jadwalService';
import DashboardClient from '@/components/DashboardClient';

export const revalidate = 0;

export default async function Home() {
  // Fetch initial data on server
  const [initialStats, initialSchedule, initialTerms] = await Promise.all([
    getStats(), // You might want to pass a default term if logic requires, but service handles default
    getTodaySchedule(100), // Get all for today
    fetchAvailableTerms(),
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
