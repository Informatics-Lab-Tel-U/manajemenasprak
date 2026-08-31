import { getCurrentUser } from '@/lib/auth';
import { getTahunAjaranList } from '@/services/praktikumService';
import { PelanggaranRekapWrapper } from './PelanggaranRekapWrapper';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Rekap Pelanggaran | Informatics Lab',
  description: 'Rekapitulasi data pelanggaran asisten praktikum',
};

export default async function PelanggaranRekapPage() {
  let user = null;
  let years: string[] = [];

  try {
    const [fetchedUser, fetchedYears] = await Promise.all([getCurrentUser(), getTahunAjaranList()]);
    user = fetchedUser;
    years = fetchedYears;
  } catch (error) {
    console.error('Failed to load pelanggaran-rekap page SSR data:', error);
  }

  if (!user) return null;

  return (
    <PelanggaranRekapWrapper initialTahunAjaranList={years} userRole={user.pengguna.role} />
  );
}
