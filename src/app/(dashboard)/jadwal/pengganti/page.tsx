import { getAvailableTerms } from '@/services/termService';
import { getAllMataKuliah } from '@/services/praktikumService';
import { getAllJadwal } from '@/services/jadwalService';
import JadwalPenggantiClientPage from './JadwalPenggantiClientPage';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Manage Jadwal Pengganti | Manajemen Praktikum',
  description: 'Kelola jadwal pengganti praktikum',
};

export default async function JadwalPenggantiPage() {
  const supabase = await createClient();
  
  // Parallel data fetching for performance
  const [terms, mkResult, allJadwal] = await Promise.all([
    getAvailableTerms(supabase),
    getAllMataKuliah(supabase),
    getAllJadwal(supabase),
  ]);

  return (
    <JadwalPenggantiClientPage 
      initialTerms={terms}
      initialMataKuliah={mkResult}
      initialAllJadwal={allJadwal}
    />
  );
}
