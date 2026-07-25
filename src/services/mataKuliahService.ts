import 'server-only';
import { MataKuliah } from '@/types/database';
import { honoFetch } from '@/lib/honoClient';

export interface MataKuliahWithPraktikum extends MataKuliah {
  praktikum: {
    id: string;
    nama: string;
    tahun_ajaran: string;
  };
}

export type MataKuliahGrouped = {
  mk_singkat: string;
  praktikum_id: string;
  items: MataKuliahWithPraktikum[];
};

export async function getMataKuliahByTerm(
  term: string | null
): Promise<MataKuliahGrouped[]> {
  const query = term && term !== 'all' ? `?term=${encodeURIComponent(term)}` : '';
  const result = await honoFetch<MataKuliahGrouped[]>(`/api/mata-kuliah${query}`);
  return result.ok && result.data ? result.data : [];
}

export interface CreateMataKuliahPayload {
  id_praktikum: string;
  nama_lengkap: string;
  program_studi: string;
  dosen_koor: string;
  warna?: string;
}

export async function createMataKuliah(
  payload: CreateMataKuliahPayload
): Promise<MataKuliah | null> {
  const result = await honoFetch<MataKuliah>('/api/mata-kuliah', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    throw new Error(result.error || 'Failed to create mata kuliah');
  }

  return result.data || null;
}

export interface BulkImportMataKuliahResult {
  inserted: number;
  errors: string[];
}

export async function bulkCreateMataKuliah(
  payloads: CreateMataKuliahPayload[]
): Promise<BulkImportMataKuliahResult> {
  const result = await honoFetch<BulkImportMataKuliahResult>('/api/mata-kuliah', {
    method: 'POST',
    body: JSON.stringify({ action: 'bulk-create', payloads }),
  });

  if (!result.ok || !result.data) {
    return { inserted: 0, errors: [result.error || 'Bulk insert error'] };
  }

  return result.data;
}

export async function checkMataKuliahExists(
  praktikumId: string,
  programStudi: string
): Promise<boolean> {
  const result = await honoFetch<{ exists: boolean }>(
    `/api/mata-kuliah?action=check-exists&praktikumId=${praktikumId}&programStudi=${encodeURIComponent(programStudi)}`
  );
  return result.ok && result.data ? !!result.data.exists : false;
}

export async function updateMataKuliahColorByPraktikumName(
  nama: string,
  warna: string
): Promise<number> {
  const result = await honoFetch<{ count: number }>('/api/mata-kuliah', {
    method: 'PUT',
    body: JSON.stringify({ action: 'update-color', nama, warna }),
  });

  if (!result.ok) {
    throw new Error(result.error || 'Failed to update color');
  }

  return result.data?.count || 0;
}
