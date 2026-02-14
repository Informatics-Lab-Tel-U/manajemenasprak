import { createClient } from '@/lib/supabase/server';
import { DashboardStats } from '@/services/databaseService'; // Import interface only

export async function getStats(initialTerm?: string): Promise<DashboardStats> {
  const supabase = await createClient();
  initialTerm = initialTerm || '2425-1';
  
  const [asprakRes, jadwalRes, pelanggaranRes, asprakRaw, jadwalRaw] = await Promise.all([
    supabase
      .from('Asprak_Praktikum')
      .select(
        `*, 
          praktikum:Praktikum!inner (
              tahun_ajaran
        )
        `,
        { count: 'exact', head: true }
      )
      .eq('praktikum.tahun_ajaran', initialTerm),
    supabase
      .from('Jadwal')
      .select(
        `*,
        mata_kuliah:Mata_Kuliah!inner (
          praktikum:Praktikum!inner (
              tahun_ajaran
          )
        )
      )
        `,
        { count: 'exact', head: true }
      )
      .eq('mata_kuliah.praktikum.tahun_ajaran', initialTerm),
    supabase
      .from('Pelanggaran')
      .select(
        `*,
        jadwal:Jadwal!inner (
          mata_kuliah:Mata_Kuliah!inner (
            praktikum:Praktikum!inner (
                tahun_ajaran
            )
        )
      )
        `,
        { count: 'exact', head: true }
      )
      .eq('jadwal.mata_kuliah.praktikum.tahun_ajaran', initialTerm),
    supabase.from('Asprak').select('angkatan'),
    supabase.from('Jadwal').select('hari'),
  ]);

  // Type-safe data processing for asprak by angkatan
  interface AsprakRow {
    angkatan?: number | string;
  }
  
  const asprakMap: Record<string, number> = {};
  (asprakRaw.data as AsprakRow[] || []).forEach((a) => {
    const ang = a.angkatan?.toString() || 'Unknown';
    asprakMap[ang] = (asprakMap[ang] || 0) + 1;
  });
  const asprakByAngkatan = Object.entries(asprakMap).map(([name, count]) => ({ name, count }));

  // Type-safe data processing for jadwal by day
  interface JadwalRow {
    hari?: string;
  }
  
  const jadwalMap: Record<string, number> = {};
  (jadwalRaw.data as JadwalRow[] || []).forEach((j) => {
    let day = j.hari ? j.hari.toString().trim().toLowerCase() : 'unknown';
    day = day.charAt(0).toUpperCase() + day.slice(1);
    jadwalMap[day] = (jadwalMap[day] || 0) + 1;
  });
  const jadwalByDay = Object.entries(jadwalMap).map(([name, count]) => ({ name, count }));

  return {
    asprakCount: asprakRes.count || 0,
    jadwalCount: jadwalRes.count || 0,
    pelanggaranCount: pelanggaranRes.count || 0,
    asprakByAngkatan,
    jadwalByDay,
  };
}
