import { Jadwal, JadwalPengganti } from '@/types/database';
import type {
  CreateJadwalInput,
  UpdateJadwalInput,
  CreateJadwalPenggantiInput,
} from '@/services/jadwalService';
import { ServiceResult } from '@/types/api';
import { apiFetch } from '@/lib/clientFetch';

export async function fetchAvailableTerms(): Promise<ServiceResult<string[]>> {
  return apiFetch<string[]>('/api/jadwal', {
    params: { action: 'terms' },
    cache: 'no-store',
  });
}

export async function fetchJadwalByTerm(term: string): Promise<ServiceResult<Jadwal[]>> {
  return apiFetch<Jadwal[]>('/api/jadwal', {
    params: { action: 'by-term', term },
    cache: 'no-store',
  });
}

export async function fetchTodaySchedule(
  limit: number = 5,
  term?: string
): Promise<ServiceResult<Jadwal[]>> {
  return apiFetch<Jadwal[]>('/api/jadwal', {
    params: { action: 'today', limit: String(limit), term },
    cache: 'no-store',
  });
}

export async function createJadwal(input: CreateJadwalInput): Promise<ServiceResult<Jadwal>> {
  return apiFetch<Jadwal>('/api/jadwal', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchScheduleForValidation(term: string): Promise<ServiceResult<any[]>> {
  return apiFetch<any[]>('/api/jadwal', {
    params: { action: 'validation', term },
    cache: 'no-store',
  });
}

export async function bulkImportJadwal(
  inputs: CreateJadwalInput[]
): Promise<ServiceResult<{ inserted: number; errors: string[] }>> {
  return apiFetch<{ inserted: number; errors: string[] }>('/api/jadwal', {
    method: 'POST',
    params: { action: 'bulk-import' },
    body: JSON.stringify(inputs),
  });
}

export async function updateJadwal(input: UpdateJadwalInput): Promise<ServiceResult<Jadwal>> {
  return apiFetch<Jadwal>('/api/jadwal', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteJadwal(id: string): Promise<ServiceResult<null>> {
  return apiFetch<null>('/api/jadwal', {
    method: 'DELETE',
    params: { id },
  });
}

export async function deleteJadwalByTerm(term: string): Promise<ServiceResult<null>> {
  return apiFetch<null>('/api/jadwal', {
    method: 'DELETE',
    params: { action: 'by-term', term },
  });
}

export async function fetchJadwal(): Promise<ServiceResult<Jadwal[]>> {
  return apiFetch<Jadwal[]>('/api/jadwal', { cache: 'no-store' });
}

export async function fetchJadwalPengganti(
  modul: number
): Promise<ServiceResult<JadwalPengganti[]>> {
  return apiFetch<JadwalPengganti[]>('/api/jadwal', {
    params: { action: 'pengganti', modul: String(modul) },
    cache: 'no-store',
  });
}

export async function upsertJadwalPengganti(
  input: CreateJadwalPenggantiInput
): Promise<ServiceResult<JadwalPengganti>> {
  return apiFetch<JadwalPengganti>('/api/jadwal', {
    method: 'POST',
    params: { action: 'upsert-pengganti' },
    body: JSON.stringify(input),
  });
}

export async function fetchJadwalPenggantiByTerm(term: string): Promise<ServiceResult<any[]>> {
  return apiFetch<any[]>('/api/jadwal', {
    params: { action: 'pengganti-by-term', term },
    cache: 'no-store',
  });
}

export async function deleteJadwalPengganti(id: string): Promise<ServiceResult<null>> {
  return apiFetch<null>('/api/jadwal', {
    method: 'DELETE',
    params: { id, action: 'delete-pengganti' },
  });
}
