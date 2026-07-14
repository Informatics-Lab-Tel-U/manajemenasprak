import { NextRequest } from 'next/server';
import { unstable_cache } from 'next/cache';

import {
  ensurePraktikanGetAccess,
  errorResponse,
  getCorsOrigin,
  jsonWithCors,
  praktikanOptionsResponse,
} from '../_access';
import { getActivePraktikumMataKuliahOptions } from '@/services/praktikanService';
import { createAdminClient } from '@/lib/supabase/admin';

const getCachedMataKuliah = unstable_cache(
  async () => getActivePraktikumMataKuliahOptions(createAdminClient()),
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
