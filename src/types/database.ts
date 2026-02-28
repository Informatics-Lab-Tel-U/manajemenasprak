import type { Role } from '@/config/rbac';

export type Pengguna = {
  id: string;
  nama_lengkap: string;
  role: Role;
  created_at: string;
  updated_at: string;
};

export type AsprakKoordinator = {
  id: string;
  id_pengguna: string;
  id_mata_kuliah: string;
  id_praktikum?: string;
  tahun_ajaran?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  mata_kuliah?: MataKuliah;
  praktikum?: Pick<Praktikum, 'id' | 'nama' | 'tahun_ajaran'>;
};

export type Asprak = {
  id: string;
  nama_lengkap: string;
  nim: string;
  kode: string;
  angkatan?: number;
  created_at: string;
  updated_at: string;
};

export type Praktikum = {
  id: string;
  nama: string;
  tahun_ajaran: string;
  created_at: string;
  updated_at: string;
};

export type MataKuliah = {
  id: string;
  id_praktikum: string;
  nama_lengkap: string;
  program_studi: string;
  dosen_koor?: string;
  warna?: string;
  created_at: string;
  updated_at: string;
  praktikum?: Pick<Praktikum, 'nama' | 'tahun_ajaran'>;
};

export type JadwalPengganti = {
  id: string;
  id_jadwal: string;
  modul: number;
  tanggal: string;
  hari: string;
  sesi?: number;
  jam: string;
  ruangan: string;
  created_at: string;
  updated_at: string;
};

export type Jadwal = {
  id: string;
  id_mk: string;
  kelas: string;
  hari: string;
  sesi?: number;
  jam: string;
  ruangan?: string;
  total_asprak: number;
  dosen?: string;
  created_at: string;
  updated_at: string;
  mata_kuliah?: MataKuliah;
  jadwal_pengganti?: JadwalPengganti[];
};

export type Pelanggaran = {
  id: string;
  id_asprak: string;
  id_jadwal: string;
  modul: number;
  jenis: string;
  is_final: boolean;
  finalized_by?: string;
  finalized_at?: string;
  created_at: string;
  updated_at: string;
  asprak?: Pick<Asprak, 'nama_lengkap' | 'nim' | 'kode'>;
  jadwal?: Pick<Jadwal, 'hari' | 'jam' | 'kelas'> & {
    mata_kuliah?: Pick<MataKuliah, 'id' | 'nama_lengkap' | 'program_studi'> & {
      praktikum?: Pick<Praktikum, 'id' | 'nama' | 'tahun_ajaran'>;
    };
  };
};

export type AuditLog = {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  old_values?: any;
  new_values?: any;
  id_pengguna?: string;
  created_at: string;
};

export type AuditLogWithUser = AuditLog & {
  pengguna?: Pick<Pengguna, 'nama_lengkap' | 'role'>;
};
