import { requireAuth } from '@/lib/auth';
import JadwalModulClientPage from './JadwalModulClientPage';

export const dynamic = 'force-dynamic';

export default async function JadwalModulPage() {
  await requireAuth();
  return <JadwalModulClientPage />;
}
