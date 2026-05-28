export type PraktikanRow = {
  id: string | number;
  nama: string;
  kelas: string;
  kode_asprak: string | null;
  mata_kuliah: string;
  source: 'manual' | 'import';
};

export const DATA_PRAKTIKAN_STORAGE_KEY = 'data-praktikan-local-draft';

export function makePraktikanId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function loadPraktikanRows(): PraktikanRow[] {
  const stored = window.localStorage.getItem(DATA_PRAKTIKAN_STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(DATA_PRAKTIKAN_STORAGE_KEY);
    return [];
  }
}

export function savePraktikanRows(rows: PraktikanRow[]) {
  window.localStorage.setItem(DATA_PRAKTIKAN_STORAGE_KEY, JSON.stringify(rows));
}

export function appendPraktikanRows(rows: PraktikanRow[]) {
  const current = loadPraktikanRows();
  const next = [...rows, ...current];
  savePraktikanRows(next);
  return next;
}
