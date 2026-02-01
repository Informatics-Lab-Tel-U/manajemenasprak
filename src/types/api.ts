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
