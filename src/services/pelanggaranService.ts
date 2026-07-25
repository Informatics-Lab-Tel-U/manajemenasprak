import 'server-only';
import { honoFetch } from '@/lib/honoClient';

export type PelanggaranCountEntry = {
  total: number;
  allFinal: boolean;
  finalized: boolean;
};

export type PelanggaranCountMap = Record<string, PelanggaranCountEntry>;

export type PelanggaranSummaryEntry = {
  id_asprak: string;
  nama_asprak: string;
  kode_asprak: string;
  nim_asprak: string;
  total_pelanggaran: number;
  violations: any[];
};

export async function getAllPelanggaran() {
  const result = await honoFetch('/api/pelanggaran');
  return result.ok && result.data ? result.data : [];
}

export async function getPelanggaranByFilter(idPraktikum?: string, tahunAjaran?: string) {
  const params = new URLSearchParams();
  if (idPraktikum) params.append('idPraktikum', idPraktikum);
  if (tahunAjaran) params.append('tahunAjaran', tahunAjaran);

  const query = params.toString() ? `?${params.toString()}` : '';
  const result = await honoFetch(`/api/pelanggaran${query}`);
  return result.ok && result.data ? result.data : [];
}

export async function getPelanggaranSummary(tahunAjaran: string, modul?: number, minCount: number = 1): Promise<PelanggaranSummaryEntry[]> {
  const params = new URLSearchParams();
  params.append('action', 'summary');
  params.append('tahunAjaran', tahunAjaran);
  if (modul) params.append('modul', String(modul));
  if (minCount > 1) params.append('minCount', String(minCount));

  const result = await honoFetch<PelanggaranSummaryEntry[]>(`/api/pelanggaran?${params.toString()}`);
  return result.ok && result.data ? result.data : [];
}

export async function getKoorPraktikumList(userId: string) {
  const result = await honoFetch(`/api/pelanggaran?action=praktikum-list&isKoor=true&userId=${userId}`);
  return result.ok && result.data ? result.data : [];
}

export async function getPelanggaranCountsByPraktikum(isKoor: boolean): Promise<PelanggaranCountMap> {
  const result = await honoFetch<PelanggaranCountMap>(`/api/pelanggaran?action=counts&isKoor=${isKoor}`);
  return result.ok && result.data ? result.data : {};
}
