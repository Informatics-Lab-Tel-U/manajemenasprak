import { NextRequest } from 'next/server';
import { unstable_cache } from 'next/cache';

import {
  ensurePraktikanGetAccess,
  errorResponse,
  getCorsOrigin,
  jsonWithCors,
  praktikanOptionsResponse,
} from '../_access';
import { getPraktikanKelasByMataKuliah } from '@/services/praktikanService';
import { createAdminClient } from '@/lib/supabase/admin';

function decodeQueryValue(value: string | null) {
  if (!value) return value;

  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

const getCachedKelas = (mataKuliah: string | null) => unstable_cache(
  async () => getPraktikanKelasByMataKuliah(mataKuliah, createAdminClient()),
  ['praktikan-kelas-api', mataKuliah ?? 'all'],
  { tags: ['praktikan'] }
)();

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
    const data = await getCachedKelas(mataKuliah);

    return jsonWithCors({ ok: true, data }, getCorsOrigin(authorization.access));
  } catch (error) {
    return errorResponse(error, 'GET /api/praktikan/kelas error:');
  }
}
