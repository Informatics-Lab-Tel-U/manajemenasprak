export type PraktikanRecord = {
  id: string | number;
  created_at?: string;
  nama: string;
  kelas: string;
  kode_asprak: string | null;
  mata_kuliah: string;
};

export type PraktikanOptions = {
  kelas: string[];
  mata_kuliah: string[];
};
