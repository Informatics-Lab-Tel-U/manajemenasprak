import { type NextRequest, NextResponse } from 'next/server';
import { logger, extractRequestMetadata } from '@/lib/logger';

/**
 * Safe error response for Route Handlers.
 *
 * Never returns raw internal error messages (e.g. PostgREST/Postgres messages
 * that leak table/column names) to the client. Internal details are logged on
 * the server; the client only receives a generic message.
 *
 * Validation errors that are safe to surface (known client-facing messages,
 * e.g. "Semua field wajib diisi") can pass through by returning `expose`.
 */
const GENERIC_MESSAGE = 'Terjadi kesalahan pada server';

export function apiErrorResponse(
  err: unknown,
  context: string,
  options: { status?: number; expose?: string; req?: NextRequest } = {}
): NextResponse {
  const { status = 500, expose, req } = options;

  const metadata = req ? extractRequestMetadata(req) : {};

  // Log the full internal detail server-side for debugging.
  logger.error(context, err, metadata);

  // Only return `expose` (a known, safe message) to the client when provided.
  const message = expose ?? GENERIC_MESSAGE;
  return NextResponse.json({ ok: false, error: message }, { status });
}
