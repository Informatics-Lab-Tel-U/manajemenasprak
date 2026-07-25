import { Praktikum, MataKuliah } from '@/types/database';
import { ServiceResult } from '@/types/api';
import type { PraktikumWithStats, PraktikumDetails } from '@/services/praktikumService';
import { apiFetch } from '@/lib/clientFetch';

export async function fetchAllPraktikum(): Promise<ServiceResult<Praktikum[]>> {
  return apiFetch<Praktikum[]>('/api/praktikum', {
    params: { action: 'all' },
    cache: 'no-store',
  });
}

export async function fetchPraktikumDetails(id: string): Promise<ServiceResult<PraktikumDetails>> {
  return apiFetch<PraktikumDetails>('/api/praktikum', {
    params: { action: 'details', id },
    cache: 'no-store',
  });
}

export async function fetchUniquePraktikumNames(): Promise<
  ServiceResult<{ id: string; nama: string }[]>
> {
  return apiFetch<{ id: string; nama: string }[]>('/api/praktikum', {
    params: { action: 'names' },
    cache: 'no-store',
  });
}

export async function fetchOrCreatePraktikum(
  nama: string,
  tahunAjaran: string
): Promise<ServiceResult<Praktikum>> {
  return apiFetch<Praktikum>('/api/praktikum', {
    method: 'POST',
    body: JSON.stringify({ action: 'get-or-create', nama, tahunAjaran }),
  });
}

export async function fetchMataKuliah(): Promise<ServiceResult<MataKuliah[]>> {
  return apiFetch<MataKuliah[]>('/api/praktikum', {
    params: { action: 'mata-kuliah' },
    cache: 'no-store',
  });
}

export async function fetchPraktikumByTerm(
  term: string
): Promise<ServiceResult<PraktikumWithStats[]>> {
  return apiFetch<PraktikumWithStats[]>('/api/praktikum', {
    params: { action: 'by-term', term },
    cache: 'no-store',
  });
}

interface BulkImportResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

export async function bulkImportPraktikum(
  rows: { nama: string; tahun_ajaran: string }[]
): Promise<ServiceResult<BulkImportResult>> {
  return apiFetch<BulkImportResult>('/api/praktikum', {
    method: 'POST',
    body: JSON.stringify({ action: 'bulk-import', rows }),
  });
}
