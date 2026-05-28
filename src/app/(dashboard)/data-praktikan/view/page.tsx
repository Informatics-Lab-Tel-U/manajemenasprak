import { requireAuth } from '@/lib/auth';
import DataPraktikanViewPage from '@/components/data-praktikan/DataPraktikanViewPage';

export default async function DataPraktikanViewRoute() {
  await requireAuth();

  return <DataPraktikanViewPage />;
}
