import { createClient } from '@/lib/supabase/server';
import { Jadwal } from '@/types/database';

export async function getTodaySchedule(limit: number = 5, term?: string): Promise<Jadwal[]> {
  const supabase = await createClient();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  
  const dayMap: Record<string, string> = {
    SUNDAY: 'MINGGU',
    MONDAY: 'SENIN',
    TUESDAY: 'SELASA',
    WEDNESDAY: 'RABU',
    THURSDAY: 'KAMIS',
    FRIDAY: 'JUMAT',
    SATURDAY: 'SABTU',
  };

  const dayIndo = dayMap[today] || today;

  if(dayIndo === 'MINGGU') {
    return [];
  }

  let query = supabase
    .from('jadwal')
    .select(
      `
      *,
      mata_kuliah:mata_kuliah!inner (
        nama_lengkap,
        program_studi,
        praktikum:praktikum!inner (
          tahun_ajaran,
          nama
        )
      )
    `
    )
    .eq('hari', dayIndo)
    .order('jam', { ascending: true })
    .limit(limit);

  if (term) {
    query = query.eq('mata_kuliah.praktikum.tahun_ajaran', term);
  }



  const { data, error } = await query;

  if (error) {
    console.error('Error fetching today schedule:', error);
    return [];
  }

  return data as Jadwal[];
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

  // extract unique terms
  const terms = Array.from(new Set(data.map((item) => item.tahun_ajaran)));
  return terms;
}
