import 'server-only';
import { Praktikum, MataKuliah } from '@/types/database';
import { honoFetch } from '@/lib/honoClient';

export interface PraktikumWithStats extends Praktikum {
  asprak_count: number;
}

export interface PraktikumDetails {
  total_kelas: number;
  classes: {
    kelas: string;
    jadwal: {
      hari: string;
      jam: string;
      ruangan: string;
    }[];
  }[];
}

export async function getPraktikumById(
  id: string
): Promise<Praktikum | null> {
  const result = await honoFetch<Praktikum>(`/api/praktikum?id=${id}`);
  return result.ok && result.data ? result.data : null;
}

export async function getAllPraktikum(): Promise<Praktikum[]> {
  const result = await honoFetch<Praktikum[]>('/api/praktikum?action=all');
  return result.ok && result.data ? result.data : [];
}

export async function getUniquePraktikumNames(): Promise<{ id: string; nama: string }[]> {
  const result = await honoFetch<{ id: string; nama: string }[]>('/api/praktikum?action=names');
  return result.ok && result.data ? result.data : [];
}

export async function getPraktikumByTerm(
  term?: string
): Promise<any[]> {
  const query = term && term !== 'all' ? `?action=by-term&term=${encodeURIComponent(term)}` : '?action=all';
  const result = await honoFetch<any[]>(`/api/praktikum${query}`);
  return result.ok && result.data ? result.data : [];
}

export async function getPraktikumDetails(
  praktikumId: string
): Promise<PraktikumDetails> {
  const result = await honoFetch<PraktikumDetails>(`/api/praktikum?action=details&id=${praktikumId}`);
  return result.ok && result.data ? result.data : { total_kelas: 0, classes: [] };
}

export async function getOrCreatePraktikum(
  nama: string,
  tahunAjaran: string
): Promise<Praktikum> {
  const result = await honoFetch<Praktikum>('/api/praktikum', {
    method: 'POST',
    body: JSON.stringify({ action: 'get-or-create', nama, tahunAjaran }),
  });

  if (!result.ok || !result.data) {
    throw new Error(result.error || 'Failed to create Praktikum');
  }
  return result.data;
}

export async function getAllMataKuliah(): Promise<MataKuliah[]> {
  const result = await honoFetch<MataKuliah[]>('/api/mata-kuliah');
  return result.ok && result.data ? result.data : [];
}

export interface CreateMataKuliahInput {
  id_praktikum: string;
  nama_lengkap: string;
  program_studi: string;
  dosen_koor?: string;
}

export async function createMataKuliah(
  input: CreateMataKuliahInput
): Promise<MataKuliah> {
  const result = await honoFetch<MataKuliah>('/api/praktikum', {
    method: 'POST',
    body: JSON.stringify({ action: 'create-mk', ...input }),
  });

  if (!result.ok || !result.data) {
    throw new Error(result.error || 'Failed to create MK');
  }
  return result.data;
}

export async function deletePraktikumByIds(
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  const result = await honoFetch('/api/praktikum?action=delete-ids', {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });
  if (!result.ok) {
    throw new Error(result.error || 'Failed to delete praktikum by IDs');
  }
}

export async function deleteMataKuliahByIds(
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  const result = await honoFetch('/api/praktikum?action=delete-mk-ids', {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });
  if (!result.ok) {
    throw new Error(result.error || 'Failed to delete mata kuliah by IDs');
  }
}

export async function deleteAsprakPraktikumByIds(
  ids: number[]
): Promise<void> {
  if (ids.length === 0) return;
  const result = await honoFetch('/api/praktikum?action=delete-asprak-prak-ids', {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });
  if (!result.ok) {
    throw new Error(result.error || 'Failed to delete asprak praktikum by IDs');
  }
}

export interface BulkImportPraktikumResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

export async function bulkUpsertPraktikum(
  rows: { nama: string; tahun_ajaran: string }[]
): Promise<BulkImportPraktikumResult> {
  const result = await honoFetch<BulkImportPraktikumResult>('/api/praktikum', {
    method: 'POST',
    body: JSON.stringify({ action: 'bulk-import', rows }),
  });

  if (!result.ok || !result.data) {
    return { inserted: 0, skipped: 0, errors: [result.error || 'Bulk import error'] };
  }

  return result.data;
}

export async function getTahunAjaranList(): Promise<string[]> {
  const result = await honoFetch<string[]>('/api/tahun-ajaran');
  return result.ok && result.data ? result.data : [];
}
