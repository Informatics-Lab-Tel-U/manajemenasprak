import 'server-only';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

const BACKEND_URL = process.env.HONO_BACKEND_URL || 'https://manajemenasprak-backend.iflabdev.workers.dev';

export interface HonoFetchOptions extends RequestInit {
  authHeader?: string;
  useServiceRole?: boolean;
}

/**
 * Server-side helper to make authenticated HTTP calls to Hono Backend
 */
export async function honoFetch<T = any>(
  path: string,
  options: HonoFetchOptions = {}
): Promise<{ ok: boolean; data?: T; error?: string }> {
  let { authHeader, useServiceRole, headers: customHeaders, ...restOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (!authHeader && !useServiceRole) {
    try {
      const supabase = await createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        authHeader = `Bearer ${session.access_token}`;
      }
    } catch {
      // Fallback if no active session
    }
  }

  if (authHeader) {
    headers['authorization'] = authHeader;
  }

  if (useServiceRole && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    headers['x-service-role-key'] = process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  const targetUrl = path.startsWith('http') ? path : `${BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;

  console.log(`[DEBUG honoClient.ts] ${restOptions.method || 'GET'} -> ${targetUrl} | authHeader: ${!!authHeader} | useServiceRole: ${!!useServiceRole}`);

  try {
    const res = await fetch(targetUrl, {
      headers,
      cache: 'no-store',
      ...restOptions,
    });

    const json = await res.json().catch(() => ({}));
    console.log(`[DEBUG honoClient.ts] Response status: ${res.status} | ok: ${res.ok} | json.ok: ${json?.ok}`);

    if (!res.ok || json.ok === false) {
      console.error(`[DEBUG honoClient.ts] Failed request to ${targetUrl}:`, json.error || `HTTP ${res.status}`);
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
    console.error(`[DEBUG honoClient.ts] Exception fetching ${targetUrl}:`, error);
    return {
      ok: false,
      error: error.message || 'Network / Proxy Error',
    };
  }
}
