import { requireAuth } from '@/lib/auth';
import JadwalModulClientPage from './JadwalModulClientPage';

export default async function JadwalModulPage() {
  await requireAuth();
  return <JadwalModulClientPage />;
}

