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
  modul: number;
  jenis: string;
}

export interface CreatePenggunaInput {
  email: string;
  password: string;
  nama_lengkap: string;
  role: 'ADMIN' | 'ASLAB' | 'ASPRAK_KOOR';
}

export interface UpdatePenggunaInput {
  nama_lengkap?: string;
  role?: 'ADMIN' | 'ASLAB' | 'ASPRAK_KOOR';
}
