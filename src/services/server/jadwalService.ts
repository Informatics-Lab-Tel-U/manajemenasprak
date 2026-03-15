import { createClient } from '@/lib/supabase/server';
import { Jadwal } from '@/types/database';

export async function getTodaySchedule(limit: number = 100, term?: string): Promise<Jadwal[]> {
  const supabase = await createClient();
  const now = new Date();
  
  // Use a stable date string for comparison
  const todayStr = now.toISOString().split('T')[0];
  const dayIndoMap: Record<string, string> = {
    'Sunday': 'MINGGU',
    'Monday': 'SENIN',
    'Tuesday': 'SELASA',
    'Wednesday': 'RABU',
    'Thursday': 'KAMIS',
    'Friday': 'JUMAT',
    'Saturday': 'SABTU',
  };
  const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
  const dayIndo = dayIndoMap[todayName] || todayName.toUpperCase();

  if (dayIndo === 'MINGGU') {
    return [];
  }

  // 1. Resolve Term
  let effectiveTerm = term;
  if (!effectiveTerm) {
    const terms = await fetchAvailableTerms();
    effectiveTerm = terms[0] || '';
  }
  if (!effectiveTerm) return [];

  // 2. Determine Current Module
  const { data: moduleSchedules } = await supabase
    .from('modul_schedule')
    .select('modul, tanggal_mulai')
    .eq('tahun_ajaran', effectiveTerm)
    .order('modul', { ascending: false });

  let currentModul: number | null = null;
  if (moduleSchedules && moduleSchedules.length > 0) {
    for (const ms of moduleSchedules) {
      if (ms.tanggal_mulai && ms.tanggal_mulai <= todayStr) {
        currentModul = ms.modul;
        break;
      }
    }
  }

  // 3. Fetch Default Schedules for this day and term
  const { data: defaultJadwal, error: jError } = await supabase
    .from('jadwal')
    .select(`
      *,
      mata_kuliah:mata_kuliah!inner (
        nama_lengkap,
        program_studi,
        warna,
        praktikum:praktikum!inner (
          tahun_ajaran,
          nama
        )
      )
    `)
    .eq('hari', dayIndo);

  if (jError) {
    console.error('Error fetching default schedule:', jError);
    return [];
  }

  let results = (defaultJadwal as any[]).filter(
    (j) => j.mata_kuliah?.praktikum?.tahun_ajaran === effectiveTerm
  ) as Jadwal[];

  // 4. Integrate Replacements if we have an active module
  if (currentModul !== null) {
    const { data: pengganti, error: pError } = await supabase
      .from('jadwal_pengganti')
      .select('*')
      .eq('modul', currentModul)
      .eq('hari', dayIndo);

    if (!pError && pengganti && pengganti.length > 0) {
      const penggantiMap = new Map();
      pengganti.forEach((p) => penggantiMap.set(p.id_jadwal, p));

      // Replace default entries with pengganti
      results = results.map((j) => {
        const p = penggantiMap.get(j.id);
        if (p) {
          return {
            ...j,
            ruangan: p.ruangan,
            jam: p.jam,
            sesi: p.sesi,
            __is_pengganti: true,
          } as any;
        }
        return j;
      });
    }
  }

  // Final sort by time
  results.sort((a, b) => (a.jam || '').localeCompare(b.jam || ''));

  return results.slice(0, limit);
}

export async function fetchAvailableTerms(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('praktikum')
    .select('tahun_ajaran')
    .order('tahun_ajaran', { ascending: false });

  if (error) {
    console.error('Error fetching terms:', error);
    return [];
  }

  // extract unique terms - already ordered descending, so [0] = latest
  const terms = Array.from(new Set(data.map((item) => item.tahun_ajaran)));
  return terms;
}
