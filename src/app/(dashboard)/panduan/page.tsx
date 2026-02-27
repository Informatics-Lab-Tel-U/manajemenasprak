import { requireAuth } from '@/lib/auth';
import PanduanClientPage from './PanduanClientPage';

export default async function Page() {
  const authUser = await requireAuth();

  return <PanduanClientPage role={authUser.pengguna.role} />;
}
