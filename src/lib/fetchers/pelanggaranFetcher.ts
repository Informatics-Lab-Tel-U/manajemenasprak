import { Pelanggaran, CreatePelanggaranInput } from '@/types/database';
import { ServiceResult } from '@/types/api';

export async function fetchAllPelanggaran(): Promise<ServiceResult<Pelanggaran[]>> {
  try {
    const res = await fetch('/api/pelanggaran', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function createPelanggaran(
  input: CreatePelanggaranInput
): Promise<ServiceResult<Pelanggaran>> {
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

export async function deletePelanggaran(id: number): Promise<ServiceResult<void>> {
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
