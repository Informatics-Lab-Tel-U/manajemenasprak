/**
 * Shared API types for consistent response handling across the application
 */

export interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface CreatePelanggaranInput {
  id_asprak: string;
  id_jadwal: string;
  modul?: number | null;
  jenis: string;
}

export interface CreatePenggunaInput {
  email: string;
  password: string;
  nama_lengkap: string;
  role: 'ADMIN' | 'ASLAB' | 'ASPRAK_KOOR';
  /** Only for ASPRAK_KOOR: praktikum IDs to assign. tahun_ajaran is derived via join */
  praktikum_ids?: string[];
}

export interface UpdatePenggunaInput {
  nama_lengkap?: string;
  role?: 'ADMIN' | 'ASLAB' | 'ASPRAK_KOOR';
  /** Only for ASPRAK_KOOR: praktikum IDs to assign. tahun_ajaran is derived via join */
  praktikum_ids?: string[];
}

