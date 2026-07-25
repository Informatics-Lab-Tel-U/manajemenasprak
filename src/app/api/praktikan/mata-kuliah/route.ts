import { NextRequest } from 'next/server';
import { unstable_cache } from 'next/cache';

import {
  ensurePraktikanGetAccess,
  errorResponse,
  getCorsOrigin,
  jsonWithCors,
  praktikanOptionsResponse,
} from '../_access';

const backendUrl = process.env.HONO_BACKEND_URL || 'https://manajemenasprak-backend.iflabdev.workers.dev';

const getCachedMataKuliah = unstable_cache(
  async () => {
    // Call backend with action=options to get mata_kuliah list
    const url = new URL(`${backendUrl}/api/praktikan`);
    url.searchParams.set('action', 'options');

    const res = await fetch(url.toString(), {
      headers: {
        'x-service-role-key': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      },
    });

    const json = await res.json();
    return json.data?.mata_kuliah || [];
  },
  ['praktikan-mata-kuliah-api'],
  { tags: ['praktikan'] }
);

export async function OPTIONS(request: NextRequest) {
  return praktikanOptionsResponse(request);
}

export async function GET(request: NextRequest) {
  try {
    const authorization = await ensurePraktikanGetAccess(request);
    if ('response' in authorization) return authorization.response;

    const data = await getCachedMataKuliah();
    return jsonWithCors({ ok: true, data }, getCorsOrigin(authorization.access));
  } catch (error) {
    return errorResponse(error, 'GET /api/praktikan/mata-kuliah error:');
  }
}
