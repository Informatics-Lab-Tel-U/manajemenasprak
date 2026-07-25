import { getAvailableTerms } from '@/services/termService';
import { getAllMataKuliah } from '@/services/praktikumService';
import { getAllJadwal } from '@/services/jadwalService';
import JadwalPenggantiClientPage from './JadwalPenggantiClientPage';

export const metadata = {
  title: 'Manage Jadwal Pengganti | Manajemen Praktikum',
  description: 'Kelola jadwal pengganti praktikum',
};

export default async function JadwalPenggantiPage() {
  // Parallel data fetching for performance
  const [terms, mkResult, allJadwal] = await Promise.all([
    getAvailableTerms(),
    getAllMataKuliah(),
    getAllJadwal(),
  ]);

  return (
    <JadwalPenggantiClientPage
      initialTerms={terms}
      initialMataKuliah={mkResult}
      initialAllJadwal={allJadwal}
    />
  );
}
