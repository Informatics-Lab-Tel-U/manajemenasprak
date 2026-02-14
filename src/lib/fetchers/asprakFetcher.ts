/**
 * Asprak API Fetcher (Client-side)
 * Use this for fetch() calls from client components
 */

import { logger } from '@/lib/logger';
import { Asprak } from '@/types/database';
import { ServiceResult } from '@/types/api';

export interface UpsertAsprakInput {
  nim: string;
  nama_lengkap: string;
  kode: string;
  angkatan: number;
  term: string;
  praktikumNames: string[];
}

export interface AsprakAssignment {
  id: number;
  praktikum: {
    id: string;
    nama: string;
    tahun_ajaran: string;
  };
}

export interface AsprakPlottingData extends Asprak {
    assignments: {
        id: string; // Praktikum ID
        nama: string;
        tahun_ajaran: string;
    }[];
}

export async function fetchPlottingData(term?: string): Promise<ServiceResult<AsprakPlottingData[]>> {
  try {
    const url = new URL('/api/asprak', window.location.origin);
    url.searchParams.append('action', 'plotting');
    if (term) url.searchParams.append('term', term);
    
    const res = await fetch(url.toString());
    const json = await res.json();

    if (!res.ok) {
      return { ok: false, error: json.error };
    }

    return { ok: true, data: json.data };
  } catch (e: any) {
    logger.error('Error fetching plotting data:', e);
    return { ok: false, error: e.message };
  }
}

export async function fetchAllAsprak(term?: string): Promise<ServiceResult<Asprak[]>> {
  try {
    const url = term ? `/api/asprak?term=${encodeURIComponent(term)}` : '/api/asprak';
    const res = await fetch(url);
    const json = await res.json();

    if (!res.ok) {
      return { ok: false, error: json.error };
    }

    return { ok: true, data: json.data };
  } catch (e: any) {
    logger.error('Error fetching asprak:', e);
    return { ok: false, error: e.message };
  }
}

export async function upsertAsprak(input: UpsertAsprakInput): Promise<ServiceResult<string>> {
  try {
    const res = await fetch('/api/asprak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', data: input }),
    });

    const json = await res.json();

    if (!res.ok) {
      return { ok: false, error: json.error };
    }

    return { ok: true, data: json.asprakId };
  } catch (e: any) {
    logger.error('Error upserting asprak:', e);
    return { ok: false, error: e.message };
  }
}

export async function updateAssignments(
  asprakId: number | string,
  term: string,
  praktikumIds: string[]
): Promise<ServiceResult<void>> {
  try {
    const res = await fetch('/api/asprak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-assignments', asprakId, term, praktikumIds }),
    });

    const json = await res.json();

    if (!res.ok) {
        return { ok: false, error: json.error };
    }
    return { ok: true, data: undefined };
  } catch (e: any) {
    logger.error('Error updating assignments:', e);
    return { ok: false, error: e.message };
  }
}

export async function deleteAsprak(id: number | string): Promise<ServiceResult<void>> {
  try {
    const res = await fetch('/api/asprak', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    const json = await res.json();

    if (!res.ok) {
      return { ok: false, error: json.error };
    }

    return { ok: true, data: undefined };
  } catch (e: any) {
    logger.error('Error deleting asprak:', e);
    return { ok: false, error: e.message };
  }
}

export async function fetchAsprakAssignments(
  asprakId: number | string
): Promise<ServiceResult<AsprakAssignment[]>> {
  try {
    const res = await fetch('/api/asprak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view', asprakId }),
    });

    const json = await res.json();

    if (!res.ok) {
      return { ok: false, error: json.error };
    }

    return { ok: true, data: json.assignments || [] };
  } catch (e: any) {
    logger.error('Error fetching assignments:', e);
    return { ok: false, error: e.message };
  }
}

export async function fetchExistingCodes(): Promise<ServiceResult<string[]>> {
  try {
    const res = await fetch('/api/asprak?action=codes');
    const json = await res.json();

    if (!res.ok) {
      return { ok: false, error: json.error };
    }

    return { ok: true, data: json.codes || [] };
  } catch (e: any) {
    logger.error('Error fetching codes:', e);
    return { ok: false, error: e.message };
  }
}

export async function fetchAvailableTerms(): Promise<ServiceResult<string[]>> {
  try {
    const res = await fetch('/api/asprak?action=terms');
    const json = await res.json();

    if (!res.ok) {
      return { ok: false, error: json.error };
    }

    return { ok: true, data: json.terms || [] };
  } catch (e: any) {
    logger.error('Error fetching terms:', e);
    return { ok: false, error: e.message };
  }
}

export interface BulkImportRow {
  nim: string;
  nama_lengkap: string;
  kode: string;
  angkatan: number;
}

export interface BulkImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export async function bulkImportAspraks(
  rows: BulkImportRow[]
): Promise<ServiceResult<BulkImportResult>> {
  try {
    const res = await fetch('/api/asprak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk-import', rows }),
    });

    const json = await res.json();

    if (!res.ok) {
      return { ok: false, error: json.error };
    }

    return { ok: true, data: json.result };
  } catch (e: any) {
    logger.error('Error bulk importing aspraks:', e);
    return { ok: false, error: e.message };
  }
}
