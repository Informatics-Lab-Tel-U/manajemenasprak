import { NextRequest } from 'next/server';

import {
  ensurePraktikanGetAccess,
  errorResponse,
  getCorsOrigin,
  jsonWithCors,
  praktikanOptionsResponse,
} from '../_access';
import { getPraktikanKelasByMataKuliah } from '@/services/praktikanService';

function decodeQueryValue(value: string | null) {
  if (!value) return value;

  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

export async function OPTIONS(request: NextRequest) {
  return praktikanOptionsResponse(request);
}

export async function GET(request: NextRequest) {
  try {
    const authorization = await ensurePraktikanGetAccess(request);
    if ('response' in authorization) return authorization.response;

    const searchParams = request.nextUrl.searchParams;
    const mataKuliah = decodeQueryValue(
      searchParams.get('mata_kuliah') ?? searchParams.get('matakuliah')
    );
    const data = await getPraktikanKelasByMataKuliah(mataKuliah);

    return jsonWithCors({ ok: true, data }, getCorsOrigin(authorization.access));
  } catch (error) {
    return errorResponse(error, 'GET /api/praktikan/kelas error:');
  }
}
