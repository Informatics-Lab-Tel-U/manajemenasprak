import type { ServiceResult } from '@/types/api';

export interface ClientFetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: ClientFetchOptions = {}
): Promise<ServiceResult<T>> {
  const { params, headers: customHeaders, ...restOptions } = options;

  let urlStr = endpoint;
  if (params) {
    const url = new URL(endpoint, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.append(key, String(val));
      }
    });
    urlStr = url.toString();
  }

  try {
    const res = await fetch(urlStr, {
      headers: {
        'Content-Type': 'application/json',
        ...(customHeaders as Record<string, string>),
      },
      ...restOptions,
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error: result.error || `HTTP ${res.status}`,
      };
    }

    return result;
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || 'Client Network Error',
    };
  }
}
