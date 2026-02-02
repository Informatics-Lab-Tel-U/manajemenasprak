import { supabase } from './supabase';
import { logger } from '@/lib/logger';

export interface DashboardStats {
  asprakCount: number;
  jadwalCount: number;
  pelanggaranCount: number;
  asprakByAngkatan: { name: string; count: number }[];
  jadwalByDay: { name: string; count: number }[];
}

// get by
export async function getStats(initialTerm?: string): Promise<DashboardStats> {
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

  const asprakMap: Record<string, number> = {};
  (asprakRaw.data || []).forEach((a: any) => {
    const ang = a.angkatan?.toString() || 'Unknown';
    asprakMap[ang] = (asprakMap[ang] || 0) + 1;
  });
  const asprakByAngkatan = Object.entries(asprakMap).map(([name, count]) => ({ name, count }));

  const jadwalMap: Record<string, number> = {};
  (jadwalRaw.data || []).forEach((j: any) => {
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

export async function clearAllData() {
  logger.info('Clearing all database data...');

  const tables = [
    'Pelanggaran',
    'Jadwal_Pengganti',
    'Asprak_Praktikum',
    'Jadwal',
    'Mata_Kuliah',
    'Asprak',
    'Praktikum',
  ];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      logger.error(`Failed to clear ${table}:`, error);
      throw new Error(`Failed to clear ${table}: ${error.message}`);
    }
  }

  logger.info('Database cleared successfully');
}
