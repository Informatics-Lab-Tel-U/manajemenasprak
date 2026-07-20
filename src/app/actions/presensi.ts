'use server';

import { getPraktikumDetails, getPraktikumByTerm } from '@/services/praktikumService';
import { createClient } from '@/lib/supabase/server';

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
