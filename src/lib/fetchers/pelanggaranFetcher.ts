import type { Pelanggaran, Praktikum, Jadwal } from '@/types/database';
import type { ServiceResult, CreatePelanggaranInput } from '@/types/api';
import type { PelanggaranCountMap } from '@/services/pelanggaranService';

export async function fetchAllPelanggaran(): Promise<ServiceResult<Pelanggaran[]>> {
  try {
    const res = await fetch('/api/pelanggaran', {
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

export async function fetchPelanggaranByFilter(idPraktikum?: string, tahunAjaran?: string): Promise<ServiceResult<Pelanggaran[]>> {
  try {
    const url = new URL('/api/pelanggaran', window.location.origin);
    if (idPraktikum) url.searchParams.append('idPraktikum', idPraktikum);
    if (tahunAjaran) url.searchParams.append('tahunAjaran', tahunAjaran);

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

export async function createPelanggaran(
  input: CreatePelanggaranInput
): Promise<ServiceResult<Pelanggaran | Pelanggaran[]>> {
  try {
    const res = await fetch('/api/pelanggaran', {
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

export async function deletePelanggaran(id: string): Promise<ServiceResult<void>> {
  try {
    const res = await fetch(`/api/pelanggaran?id=${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function fetchPelanggaranCounts(isKoor: boolean): Promise<ServiceResult<PelanggaranCountMap>> {
  try {
    const res = await fetch(`/api/pelanggaran?action=counts&isKoor=${isKoor}`, {
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

export async function fetchKoorPraktikumList(userId: string): Promise<ServiceResult<Praktikum[]>> {
  try {
    const res = await fetch(`/api/pelanggaran?action=praktikum-list&isKoor=true&userId=${userId}`, {
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

export async function fetchJadwalForPelanggaran(): Promise<ServiceResult<Jadwal[]>> {
  try {
    const res = await fetch('/api/pelanggaran?action=jadwal-list', {
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

export async function finalizePelanggaran(idPraktikum: string): Promise<ServiceResult<void>> {
  try {
    const res = await fetch('/api/pelanggaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'finalize', id_praktikum: idPraktikum }),
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}
export async function fetchPraktikumDetail(id: string): Promise<ServiceResult<Praktikum>> {
  try {
    const res = await fetch(`/api/pelanggaran?action=praktikum-detail&idPraktikum=${id}`, {
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
