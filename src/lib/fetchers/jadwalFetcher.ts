import { Jadwal, JadwalPengganti } from '@/types/database';
import { CreateJadwalInput, UpdateJadwalInput, CreateJadwalPenggantiInput } from '@/services/jadwalService';
import { ServiceResult } from '@/types/api';

export async function fetchAvailableTerms(): Promise<ServiceResult<string[]>> {
  try {
    const res = await fetch('/api/jadwal?action=terms', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function fetchJadwalByTerm(term: string): Promise<ServiceResult<Jadwal[]>> {
  try {
    const res = await fetch(`/api/jadwal?action=by-term&term=${encodeURIComponent(term)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function fetchTodaySchedule(limit: number = 5, term?: string): Promise<ServiceResult<Jadwal[]>> {
  try {
    const url = new URL('/api/jadwal', window.location.origin);
    url.searchParams.append('action', 'today');
    url.searchParams.append('limit', limit.toString());
    if (term) {
      url.searchParams.append('term', term);
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function createJadwal(input: CreateJadwalInput): Promise<ServiceResult<Jadwal>> {
  try {
    const res = await fetch('/api/jadwal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function fetchScheduleForValidation(term: string): Promise<ServiceResult<any[]>> {
  try {
    const res = await fetch(`/api/jadwal?action=validation&term=${encodeURIComponent(term)}`);
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function bulkImportJadwal(inputs: CreateJadwalInput[]): Promise<ServiceResult<{ inserted: number; errors: string[] }>> {
  try {
    const res = await fetch('/api/jadwal?action=bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputs),
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function updateJadwal(input: UpdateJadwalInput): Promise<ServiceResult<Jadwal>> {
  try {
    const res = await fetch('/api/jadwal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function deleteJadwal(id: number): Promise<ServiceResult<null>> {
  try {
    const res = await fetch(`/api/jadwal?id=${id}`, {
      method: 'DELETE',
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function fetchJadwalPengganti(modul: number): Promise<ServiceResult<JadwalPengganti[]>> {
  try {
    const res = await fetch(`/api/jadwal?action=pengganti&modul=${modul}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function upsertJadwalPengganti(input: CreateJadwalPenggantiInput): Promise<ServiceResult<JadwalPengganti>> {
  try {
    const res = await fetch('/api/jadwal?action=upsert-pengganti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}
