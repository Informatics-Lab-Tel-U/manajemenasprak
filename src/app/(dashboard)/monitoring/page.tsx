import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, MonitorOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { createAdminClient } from '@/lib/supabase/admin';
import RealtimeMonitoringList, { LabStatus } from './RealtimeMonitoringList';

export const metadata = {
  title: 'Monitoring Lab | Manajemen Asprak',
};

// Server Component fetching initial data directly from Supabase
export default async function MonitoringPage() {
  let initialData: LabStatus[] = [];

  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('monitoring_lab')
      .select('*')
      .order('lab_id', { ascending: true });

    if (error) {
      console.error('Error fetching initial lab data from Supabase:', error);
    } else if (data) {
      initialData = data as LabStatus[];
    }
  } catch (err) {
    console.error('Exception fetching lab data:', err);
  }

  return (
    <div className="container mx-auto max-w-[2000px] 2xl:px-8">
      <RealtimeMonitoringList initialData={initialData} />
    </div>
  );
}
