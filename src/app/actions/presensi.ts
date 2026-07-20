'use server';

import { getPraktikumDetails, getPraktikumByTerm } from '@/services/praktikumService';

export async function getPraktikumList(term: string) {
  try {
    const list = await getPraktikumByTerm(term);
    return { success: true, data: list.map((p) => ({ id: p.id, nama: p.nama })) };
  } catch (error: any) {
    console.error('Error fetching praktikum list:', error);
    return { success: false, error: error.message };
  }
}

export async function getPraktikumClasses(praktikumId: string) {
  try {
    const details = await getPraktikumDetails(praktikumId);
    return { success: true, data: details.classes.map((c) => c.kelas) };
  } catch (error: any) {
    console.error('Error fetching praktikum classes:', error);
    return { success: false, error: error.message };
  }
}
