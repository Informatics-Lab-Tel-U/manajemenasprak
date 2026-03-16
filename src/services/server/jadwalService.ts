import { createClient } from '@/lib/supabase/server';
import { Jadwal } from '@/types/database';

export async function getTodaySchedule(limit: number = 100, term?: string): Promise<Jadwal[]> {
  const supabase = await createClient();
  const now = new Date();

  // Use a stable date string for comparison
  // Use local date string (YYYY-MM-DD) to avoid UTC timezone issues at start of day
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Jakarta', // Explicitly use the server/application timezone if possible, or omit for system local
  }).format(now);
  const dayIndoMap: Record<string, string> = {
    Sunday: 'MINGGU',
    Monday: 'SENIN',
    Tuesday: 'SELASA',
    Wednesday: 'RABU',
    Thursday: 'KAMIS',
    Friday: 'JUMAT',
    Saturday: 'SABTU',
  };
  const todayName = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(now);
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
    .from('konfigurasi_modul')
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

  // 3. Fetch all default schedules and all replacements for the current module
  const { data: allDefaultJadwal, error: jError } = await supabase
    .from('jadwal')
    .select(
      `
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
    `
    )
    .eq('mata_kuliah.praktikum.tahun_ajaran', effectiveTerm);

  if (jError) {
    console.error('Error fetching schedules:', jError);
    return [];
  }

  let finalSchedule: Jadwal[] = [];

  if (currentModul === null) {
    // No active module session logic, just use defaults for the day
    finalSchedule = (allDefaultJadwal as any[]).filter((j) => j.hari === dayIndo);
  } else {
    // Fetch all replacements for this module
    const { data: replacements, error: pError } = await supabase
      .from('jadwal_pengganti')
      .select('*')
      .eq('modul', currentModul);

    if (pError) {
      console.error('Error fetching replacements:', pError);
      return [];
    }

    const replacementMap = new Map<string, any>();
    replacements?.forEach((r) => replacementMap.set(r.id_jadwal, r));

    // 1. Start with default schedules that are ON today and NOT moved away
    const todayDefaults = (allDefaultJadwal as any[]).filter((j) => {
      const p = replacementMap.get(j.id);
      if (!p) return j.hari === dayIndo; // No replacement, check if it's normally today
      return p.hari === dayIndo; // Has replacement, check if the replacement is today
    });

    // 2. Map default info to replacement info if it exists
    finalSchedule = todayDefaults.map((j) => {
      const p = replacementMap.get(j.id);
      if (p) {
        return {
          ...j,
          ruangan: p.ruangan,
          jam: p.jam,
          sesi: p.sesi,
          hari: p.hari,
          tanggal: p.tanggal,
          __is_pengganti: true,
        };
      }
      return j;
    });

    // 3. Add schedules that are NOT normally today but are moved TO today
    // Actually, the filter above already handles this if we include ALL schedules in allDefaultJadwal
    // But let's verify:
    // If j.hari is TUESDAY, but p.hari is MONDAY (today).
    // The filter `j => { const p = replacementMap.get(j.id); if(!p) return j.hari === 'SENIN'; return p.hari === 'SENIN'; }`
    // will correctly pick it up.
  }

  // Final sort by time
  finalSchedule.sort((a, b) => (a.jam || '').localeCompare(b.jam || ''));

  return finalSchedule.slice(0, limit);
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
