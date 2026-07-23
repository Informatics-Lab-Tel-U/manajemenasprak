import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, MonitorOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { getMonitoringLabs } from '@/services/monitoringService';
import RealtimeMonitoringList, { LabStatus } from './RealtimeMonitoringList';

export const metadata = {
  title: 'Monitoring Lab | Manajemen Asprak',
};

// Server Component fetching initial data directly from Supabase
export default async function MonitoringPage() {
  let initialData: LabStatus[] = [];

  try {
    initialData = await getMonitoringLabs();
  } catch (err) {
    console.error('Failed to load initial lab data:', err);
  }

  return (
    <div className="container mx-auto max-w-[2000px] 2xl:px-8">
      <RealtimeMonitoringList initialData={initialData} />
    </div>
  );
}
