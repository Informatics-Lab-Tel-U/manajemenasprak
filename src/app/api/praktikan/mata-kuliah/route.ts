import { NextRequest } from 'next/server';

import {
  ensurePraktikanGetAccess,
  errorResponse,
  getCorsOrigin,
  jsonWithCors,
  praktikanOptionsResponse,
} from '../_access';
import { getActivePraktikumMataKuliahOptions } from '@/services/praktikanService';

export async function OPTIONS(request: NextRequest) {
  return praktikanOptionsResponse(request);
}

export async function GET(request: NextRequest) {
  try {
    const authorization = await ensurePraktikanGetAccess(request);
    if ('response' in authorization) return authorization.response;

    const data = await getActivePraktikumMataKuliahOptions();
    return jsonWithCors({ ok: true, data }, getCorsOrigin(authorization.access));
  } catch (error) {
    return errorResponse(error, 'GET /api/praktikan/mata-kuliah error:');
  }
}
