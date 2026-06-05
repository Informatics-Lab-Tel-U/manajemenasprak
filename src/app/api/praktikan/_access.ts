import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

import { requireRole } from '@/lib/auth';
import { logger } from '@/lib/logger';

const API_KEY_HEADERS = ['x-praktikan-api-key', 'x-external-api-key'] as const;

function normalizeOrigin(origin: string | null) {
  if (!origin) return null;
  const trimmed = origin.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}

const ALLOWED_ORIGINS = Array.from(
  new Set(
    (process.env.PRAKTIKAN_GET_ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => normalizeOrigin(origin))
      .filter((origin): origin is string => Boolean(origin))
  )
);

export function errorResponse(error: unknown, context: string) {
  logger.error(context, error);
  const message = error instanceof Error ? error.message : 'Internal server error';
  const status = message.includes('wajib diisi') || message.includes('Tidak ada data') ? 400 : 500;

  return NextResponse.json({ ok: false, error: message }, { status });
}

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function findProvidedApiKey(request: NextRequest) {
  for (const header of API_KEY_HEADERS) {
    const value = request.headers.get(header)?.trim();
    if (value) return value;
  }
  return null;
}

function resolveCorsOrigin(origin: string | null) {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return null;
  return ALLOWED_ORIGINS.includes(normalized) ? normalized : null;
}

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': `${API_KEY_HEADERS.join(', ')}, Content-Type`,
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

type ExternalGetAuth =
  | { kind: 'api-key'; corsOrigin: string | null }
  | { kind: 'session' }
  | { kind: 'reject'; status: 401 | 403; message: string };

export type PraktikanGetAccess = Exclude<ExternalGetAuth, { kind: 'reject' }>;

function authorizeExternalGet(request: NextRequest): ExternalGetAuth {
  const requestOrigin = normalizeOrigin(request.nextUrl.origin);
  const callerOrigin = normalizeOrigin(request.headers.get('origin'));
  const isCrossOriginBrowserRequest =
    Boolean(callerOrigin) && Boolean(requestOrigin) && callerOrigin !== requestOrigin;

  const providedKey = findProvidedApiKey(request);
  if (!providedKey) {
    if (isCrossOriginBrowserRequest) {
      logger.warn('GET /api/praktikan rejected: API key required for cross-origin request', {
        origin: callerOrigin,
        requestOrigin,
      });
      return { kind: 'reject', status: 401, message: 'API key required' };
    }
    return { kind: 'session' };
  }

  const expectedKey = (process.env.PRAKTIKAN_GET_API_KEY ?? '').trim();
  if (!expectedKey || !secureEquals(providedKey, expectedKey)) {
    logger.warn('GET /api/praktikan rejected: invalid API key', {
      hasProvidedKey: Boolean(providedKey),
      providedKeyLength: providedKey.length,
      expectedKeyLength: expectedKey.length,
      origin: request.headers.get('origin'),
    });
    return { kind: 'reject', status: 401, message: 'Invalid API key' };
  }

  if (callerOrigin) {
    const allowedOrigin = resolveCorsOrigin(callerOrigin);
    if (!allowedOrigin) {
      logger.warn('GET /api/praktikan rejected: origin not allowed', {
        origin: callerOrigin,
        allowedOrigins: ALLOWED_ORIGINS,
      });
      return { kind: 'reject', status: 403, message: 'Origin not allowed' };
    }
    return { kind: 'api-key', corsOrigin: allowedOrigin };
  }

  return { kind: 'api-key', corsOrigin: null };
}

export async function ensurePraktikanGetAccess(
  request: NextRequest
): Promise<{ access: PraktikanGetAccess } | { response: NextResponse }> {
  const access = authorizeExternalGet(request);
  if (access.kind === 'reject') {
    const origin = resolveCorsOrigin(request.headers.get('origin'));
    if (origin) {
      return {
        response: NextResponse.json(
          { ok: false, error: access.message },
          { status: access.status, headers: corsHeaders(origin) }
        ),
      };
    }
    return {
      response: NextResponse.json({ ok: false, error: access.message }, { status: access.status }),
    };
  }

  if (access.kind === 'session') {
    await requireRole(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
  }

  return { access };
}

export function jsonWithCors(data: unknown, corsOrigin: string | null) {
  if (!corsOrigin) return NextResponse.json(data);
  return NextResponse.json(data, { headers: corsHeaders(corsOrigin) });
}

export function getCorsOrigin(access: PraktikanGetAccess) {
  return access.kind === 'api-key' ? access.corsOrigin : null;
}

export function praktikanOptionsResponse(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigin = resolveCorsOrigin(origin);
  if (!allowedOrigin) {
    logger.warn('OPTIONS /api/praktikan rejected: origin not allowed', {
      origin,
      allowedOrigins: ALLOWED_ORIGINS,
    });
    return NextResponse.json({ ok: false, error: 'Origin not allowed' }, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(allowedOrigin),
  });
}
