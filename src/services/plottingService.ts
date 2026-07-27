import 'server-only';
import { honoFetch } from '@/lib/honoClient';

export interface PlottingItem {
  id: number;
  asprak: {
    id: string;
    kode: string;
    nama_lengkap: string;
    nim: string;
  };
  praktikum: {
    id: string;
    nama: string;
    tahun_ajaran: string;
  };
}

export interface PlottingListResult {
  data: PlottingItem[];
  total: number;
}

export async function getPlottingList(
  page: number,
  limit: number,
  term?: string,
  praktikumId?: string
): Promise<PlottingListResult> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (term && term !== 'all') params.append('term', term);
  if (praktikumId && praktikumId !== 'all') params.append('praktikumId', praktikumId);

  const result = await honoFetch<any>(`/api/plotting?${params.toString()}`);
  if (!result.ok || !result.data) {
    return { data: [], total: 0 };
  }

  if (Array.isArray(result.data)) {
    return {
      data: result.data,
      total: result.data.length,
    };
  }

  return {
    data: Array.isArray(result.data.data) ? result.data.data : [],
    total: typeof result.data.total === 'number' ? result.data.total : (result.data.data?.length || 0),
  };
}

export interface ValidatePlottingRow {
  kode_asprak: string;
  mk_singkat: string;
  selected_asprak_id?: string;
}

export interface ValidationResult {
  validRows: { asprak_id: string; praktikum_id: string; original: ValidatePlottingRow }[];
  ambiguousRows: {
    original: ValidatePlottingRow;
    candidates: { id: string; nama_lengkap: string; nim: string; angkatan: number }[];
    reason: string;
    praktikum_id: string;
  }[];
  invalidRows: { original: ValidatePlottingRow; reason: string }[];
}

export async function validatePlottingImport(
  rows: ValidatePlottingRow[],
  term: string,
  pendingAspraks?: { kode: string; nama_lengkap: string; nim: string; angkatan: number }[]
): Promise<ValidationResult> {
  const result = await honoFetch<ValidationResult>('/api/plotting', {
    method: 'POST',
    body: JSON.stringify({ action: 'validate-import', rows, term, pendingAspraks }),
  });

  if (!result.ok || !result.data) {
    throw new Error(result.error || 'Validation failed');
  }
  return result.data;
}

export async function savePlotting(
  assignments: { asprak_id: string; praktikum_id: string }[]
) {
  if (!assignments || assignments.length === 0) return;
  const result = await honoFetch('/api/plotting', {
    method: 'POST',
    body: JSON.stringify({ action: 'save-plotting', assignments }),
  });

  if (!result.ok) {
    throw new Error(result.error || 'Failed to save plotting');
  }
}

export async function deletePlotting(id: number) {
  const result = await honoFetch(`/api/plotting/${id}`, {
    method: 'DELETE',
  });
  if (!result.ok) {
    throw new Error(result.error || 'Failed to delete plotting');
  }
}
