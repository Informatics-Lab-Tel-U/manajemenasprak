import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, MonitorOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const metadata = {
  title: 'Monitoring Lab | Manajemen Asprak',
};

// Polling page every 15 seconds
export const revalidate = 15;

type LabStatus = {
  kelas: string;
  status: string;
  last_seen: string;
};

export default async function MonitoringPage() {
  let monitoringData: { lab_id: string; data: LabStatus }[] = [];

  try {
    const { env } = getCloudflareContext();
    const kv = (env as any).MONITORING_KV;

    if (kv) {
      // List all keys (lab_ids) in KV
      const keysList = await kv.list();
      
      // Fetch data for each key
      for (const keyObj of keysList.keys) {
        const lab_id = keyObj.name;
        const valueStr = await kv.get(lab_id);
        if (valueStr) {
          const data = JSON.parse(valueStr) as LabStatus;
          monitoringData.push({ lab_id, data });
        }
      }

      // Sort alphabetically by lab_id
      monitoringData.sort((a, b) => a.lab_id.localeCompare(b.lab_id));
    } else {
      console.error('MONITORING_KV binding is missing');
    }
  } catch (err) {
    console.error('Error fetching KV for monitoring:', err);
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Monitoring Lab</h2>
      </div>
      <div className="text-muted-foreground mb-6">
        Pantau status proyektor Generator Kursi di setiap ruangan Lab secara real-time.
      </div>

      {monitoringData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 rounded-lg border border-dashed">
          <MonitorOff className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Belum Ada Data Lab</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            Sistem belum menerima sinyal *heartbeat* dari PC Lab manapun. Pastikan Generator Kursi sedang dibuka di PC Lab yang telah dikonfigurasi.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {monitoringData.map(({ lab_id, data }) => {
            const lastSeenTime = new Date(data.last_seen);
            // If it's in KV, it's considered online because TTL handles expiration
            const isOnline = true;

            return (
              <Card key={lab_id} className={`overflow-hidden transition-all duration-200 ${isOnline ? 'border-green-500/50 shadow-sm shadow-green-100 dark:shadow-none' : 'opacity-70'}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xl font-bold">
                    {lab_id}
                  </CardTitle>
                  <Activity className={`h-5 w-5 ${isOnline ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">Status</span>
                      {isOnline ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-200">
                          🟢 Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive dark:bg-destructive/20">
                          🔴 Offline
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">Kelas Aktif</span>
                      <span className="text-sm font-bold bg-muted px-2 py-1 rounded">
                        {isOnline ? data.kelas : '-'}
                      </span>
                    </div>

                    <div className="text-xs text-right text-muted-foreground mt-2">
                      Detak terakhir: {formatDistanceToNow(lastSeenTime, { addSuffix: true, locale: id })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
