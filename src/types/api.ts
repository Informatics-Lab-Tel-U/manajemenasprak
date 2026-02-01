/**
 * Shared API types for consistent response handling across the application
 */

/**
 * Standard API response format
 * Used by all fetchers to provide consistent error handling
 */
export interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Input type for creating a new Pelanggaran record
 */
export interface CreatePelanggaranInput {
  id_asprak: string;
  id_jadwal: number;
  jenis: string;
  modul?: string;
}
