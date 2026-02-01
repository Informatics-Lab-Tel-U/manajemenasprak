import { Praktikum } from '@/types/database';
import { ServiceResult } from '@/types/api';

export async function fetchAllPraktikum(): Promise<ServiceResult<Praktikum[]>> {
  try {
    const res = await fetch('/api/praktikum?action=all', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function fetchUniquePraktikumNames(): Promise<
  ServiceResult<{ id: string; nama: string }[]>
> {
  try {
    const res = await fetch('/api/praktikum?action=names', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function fetchOrCreatePraktikum(
  nama: string,
  tahunAjaran: string
): Promise<ServiceResult<Praktikum>> {
  try {
    const res = await fetch('/api/praktikum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get-or-create', nama, tahunAjaran }),
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}
