import 'server-only';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.HONO_BACKEND_URL || 'https://manajemenasprak-backend.workers.dev';

export interface HonoFetchOptions extends RequestInit {
  authHeader?: string;
}

/**
 * Server-side helper to make authenticated HTTP calls to Hono Backend
 */
export async function honoFetch<T = any>(
  path: string,
  options: HonoFetchOptions = {}
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const { authHeader, headers: customHeaders, ...restOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (authHeader) {
    headers['authorization'] = authHeader;
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    headers['x-service-role-key'] = process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  const targetUrl = path.startsWith('http') ? path : `${BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;

  try {
    const res = await fetch(targetUrl, {
      headers,
      cache: 'no-store',
      ...restOptions,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || json.ok === false) {
      return {
        ok: false,
        error: json.error || `Hono Backend error: HTTP ${res.status}`,
      };
    }

    return {
      ok: true,
      data: json.data !== undefined ? json.data : json,
    };
  } catch (error: any) {
    logger.error(`[honoFetch Error] ${targetUrl}:`, error);
    return {
      ok: false,
      error: error.message || 'Network / Proxy Error',
    };
  }
}
