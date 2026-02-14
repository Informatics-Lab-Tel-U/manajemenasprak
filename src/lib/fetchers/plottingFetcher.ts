
import { logger } from '@/lib/logger';
import { ServiceResult } from '@/types/api';

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
  term: string
): Promise<ServiceResult<ValidationResult>> {
  try {
    const res = await fetch('/api/plotting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate-import', rows, term }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error };
    return { ok: true, data: json };
  } catch (e: any) {
    logger.error('Error validating plotting import:', e);
    return { ok: false, error: e.message };
  }
}

export async function savePlotting(
  assignments: { asprak_id: string; praktikum_id: string }[]
): Promise<ServiceResult<void>> {
  try {
    const res = await fetch('/api/plotting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-plotting', assignments }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error };
    return { ok: true, data: undefined };
  } catch (e: any) {
    logger.error('Error saving plotting:', e);
    return { ok: false, error: e.message };
  }
}
