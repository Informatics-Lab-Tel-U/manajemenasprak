export type Asprak = {
  id: string;
  nama_lengkap: string;
  nim: string;
  kode: string;
  angkatan: number;
  created_at: string;
};

export type Praktikum = {
  id: string;
  nama: string;
  tahun_ajaran: string;
};

export type MataKuliah = {
  id: number;
  id_praktikum: string;
  nama_lengkap: string;
  program_studi: string;
  dosen_koor?: string;
  praktikum?: {
    nama: string;
    tahun_ajaran: string;
  };
};

export type JadwalPengganti = {
  id: string;
  id_jadwal: number;
  modul: number;
  tanggal: string;
  hari: string;
  sesi: number;
  jam: string;
  ruangan: string;
  created_at: string;
};

export type Jadwal = {
  id: number;
  id_mk: number;
  kelas: string;
  hari: string;
  sesi: number;
  jam: string;
  ruangan: string | null;
  total_asprak: number;
  dosen?: string;
  mata_kuliah?: MataKuliah;
  jadwal_pengganti?: JadwalPengganti[];
  tanggal?: string;
};

export type Pelanggaran = {
  id: number;
  id_asprak: string;
  id_jadwal: number;
  modul?: string;
  jenis: string;
  keterangan?: string;
  created_at: string;
  asprak?: Asprak;
  jadwal?: Jadwal;
};

export type CreatePelanggaranInput = {
  id_asprak: string;
  id_jadwal: number;
  jenis: string;
  modul?: string;
  keterangan?: string;
};
