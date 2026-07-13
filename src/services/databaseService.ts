import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export interface DashboardStats {
  asprakCount: number;
  jadwalCount: number;
  pelanggaranCount: number;
  asprakByAngkatan: { name: string; count: number }[];
  jadwalByDay: { name: string; count: number }[];
}

export async function getStats(
  initialTerm?: string,
  supabaseClient?: SupabaseClient
): Promise<DashboardStats> {
  const supabase = supabaseClient ?? (await createClient());

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

  const uniqueAsprakIds = new Set((asprakRes.data as any[])?.map((d) => d.id_asprak));

  return {
    asprakCount: uniqueAsprakIds.size,
    jadwalCount: jadwalRes.count || 0,
    pelanggaranCount: pelanggaranRes.count || 0,
    asprakByAngkatan,
    jadwalByDay,
  };
}

export async function clearAllData(supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient ?? createAdminClient();
  logger.info('Clearing all database data...');

  const clearTable = async (table: string) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw new Error(`Failed to clear ${table}: ${error.message}`);
  };

  await clearTable('audit_log');
  await clearTable('pelanggaran');
  await clearTable('jadwal_pengganti');
  await clearTable('asprak_praktikum');
  await clearTable('asprak_koordinator');
  await clearTable('jadwal');
  await clearTable('mata_kuliah');
  await clearTable('asprak');
  await clearTable('praktikum');

  logger.info('Database cleared successfully');
}
