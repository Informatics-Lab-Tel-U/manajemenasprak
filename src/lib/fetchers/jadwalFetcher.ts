import { Jadwal } from '@/types/database';
import { CreateJadwalInput, UpdateJadwalInput } from '@/services/jadwalService';
import { ServiceResult } from '@/types/api';

export async function fetchAvailableTerms(): Promise<ServiceResult<string[]>> {
  try {
    const res = await fetch('/api/jadwal?action=terms', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
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
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function fetchTodaySchedule(limit: number = 5): Promise<ServiceResult<Jadwal[]>> {
  try {
    const res = await fetch(`/api/jadwal?action=today&limit=${limit}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
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
