import { ServiceResult } from '@/types/api';
import { apiFetch } from '@/lib/clientFetch';

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
): Promise<ServiceResult<ValidationResult>> {
  return apiFetch<ValidationResult>('/api/plotting', {
    method: 'POST',
    body: JSON.stringify({ action: 'validate-import', rows, term, pendingAspraks }),
  });
}

export async function savePlotting(
  assignments: { asprak_id: string; praktikum_id: string }[]
): Promise<ServiceResult<void>> {
  return apiFetch<void>('/api/plotting', {
    method: 'POST',
    body: JSON.stringify({ action: 'save-plotting', assignments }),
  });
}
