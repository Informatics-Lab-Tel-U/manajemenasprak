import { requireAuth } from '@/lib/auth';
import DataPraktikanInputPage from '@/components/data-praktikan/DataPraktikanInputPage';

export default async function DataPraktikanInputRoute() {
  await requireAuth();

  return <DataPraktikanInputPage />;
}
