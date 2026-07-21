'use server';

import { getPraktikumDetails, getPraktikumByTerm } from '@/services/praktikumService';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function getPraktikumList(term: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const list = await getPraktikumByTerm(term);
    return { success: true, data: list.map((p) => ({ id: p.id, nama: p.nama })) };
  } catch (error: any) {
    console.error('Error fetching praktikum list:', error);
    return { success: false, error: error.message };
  }
}

export async function getPraktikumClasses(praktikumId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const details = await getPraktikumDetails(praktikumId);
    return { success: true, data: details.classes.map((c) => c.kelas) };
  } catch (error: any) {
    console.error('Error fetching praktikum classes:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mengambil daftar asprak (nama + kode) yang terdaftar pada suatu praktikum.
 * Data ini digunakan untuk sheet "ASPRAK BELUM NILAI" dan "REKAP".
 */
export async function getAsprakListByPraktikum(praktikumId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('asprak_praktikum')
      .select(`
        asprak (
          nama_lengkap,
          kode
        )
      `)
      .eq('id_praktikum', praktikumId);

    if (error) {
      logger.error('Error fetching asprak list for praktikum:', error);
      return { success: false, error: error.message };
    }

    // Flatten dan deduplikasi berdasarkan kode
    const seen = new Set<string>();
    const asprakList: { nama: string; kode: string }[] = [];
    for (const rawRow of data || []) {
      const row = rawRow as any;
      const nama = (row.asprak?.nama_lengkap as string) ?? '';
      const kode = (row.asprak?.kode as string) ?? '';
      if (kode && !seen.has(kode)) {
        seen.add(kode);
        asprakList.push({ nama, kode });
      }
    }
    asprakList.sort((a, b) => a.kode.localeCompare(b.kode));

    return { success: true, data: asprakList };
  } catch (error: any) {
    logger.error('Error in getAsprakListByPraktikum:', error);
    return { success: false, error: error.message };
  }
}
