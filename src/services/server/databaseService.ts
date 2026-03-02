import { createClient } from '@/lib/supabase/server';
import { DashboardStats } from '@/services/databaseService'; // Import interface only

export async function getStats(initialTerm?: string): Promise<DashboardStats> {
  const supabase = await createClient();

  // If no term provided, fetch the latest one dynamically
  if (!initialTerm) {
    const { data: termData } = await supabase
      .from('praktikum')
      .select('tahun_ajaran')
      .order('tahun_ajaran', { ascending: false })
      .limit(1)
      .single();
    initialTerm = termData?.tahun_ajaran || '';
  }

  const [asprakRes, jadwalRes, pelanggaranRes, asprakRaw, jadwalRaw] = await Promise.all([
    supabase
      .from('asprak_praktikum')
      .select(
        `id_asprak, 
          praktikum:praktikum!inner (
              tahun_ajaran
        )
        `
      )
      .eq('praktikum.tahun_ajaran', initialTerm),
    supabase
      .from('jadwal')
      .select(
        `*,
        mata_kuliah:mata_kuliah!inner (
          praktikum:praktikum!inner (
              tahun_ajaran
          )
        )
      )
        `,
        { count: 'exact', head: true }
      )
      .eq('mata_kuliah.praktikum.tahun_ajaran', initialTerm),
    supabase
      .from('pelanggaran')
      .select(
        `*,
        jadwal:jadwal!inner (
          mata_kuliah:mata_kuliah!inner (
            praktikum:praktikum!inner (
                tahun_ajaran
            )
        )
      )
        `,
        { count: 'exact', head: true }
      )
      .eq('jadwal.mata_kuliah.praktikum.tahun_ajaran', initialTerm),
    supabase.from('asprak').select('angkatan'),
    supabase.from('jadwal').select('hari'),
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

  const uniqueAsprakIds = new Set((asprakRes.data as any[])?.map((d) => d.id_asprak));

  return {
    asprakCount: uniqueAsprakIds.size,
    jadwalCount: jadwalRes.count || 0,
    pelanggaranCount: pelanggaranRes.count || 0,
    asprakByAngkatan,
    jadwalByDay,
  };
}
