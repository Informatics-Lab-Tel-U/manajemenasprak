import { type NextRequest, NextResponse } from 'next/server';
import { logger, extractRequestMetadata } from '@/lib/logger';

const GENERIC_MESSAGE = 'Terjadi kesalahan pada server';

export function apiErrorResponse(
  err: unknown,
  context: string,
  options: { status?: number; expose?: string; req?: NextRequest } = {}
): NextResponse {
  const { status = 500, expose, req } = options;
  const metadata = req ? extractRequestMetadata(req) : {};
  logger.error(context, err, metadata);
  const message = expose ?? GENERIC_MESSAGE;
  return NextResponse.json({ ok: false, error: message }, { status });
}
