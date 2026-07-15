import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache, revalidateTag } from 'next/cache';

export const fetchCache = 'force-no-store';

import { requireRoleApi } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createPraktikan,
  deletePraktikan,
  deletePraktikanByKelas,
  getPraktikanList,
  getPraktikanOptions,
  updatePraktikan,
  deleteAllPraktikan,
} from '@/services/praktikanService';
import {
  ensurePraktikanGetAccess,
  errorResponse,
  getCorsOrigin,
  jsonWithCors,
  praktikanOptionsResponse,
} from './_access';

const getCachedOptions = unstable_cache(
  async () => getPraktikanOptions(createAdminClient()),
  ['praktikan-options'],
  { tags: ['praktikan'] }
);

const getCachedList = (kelas: string | undefined, mata_kuliah: string | undefined) =>
  unstable_cache(
    async () => getPraktikanList({ kelas, mata_kuliah }, createAdminClient()),
    ['praktikan-list', kelas ?? 'all', mata_kuliah ?? 'all'],
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
    const action = searchParams.get('action');

    if (action === 'options') {
      const data = await getCachedOptions();
      return jsonWithCors({ ok: true, data }, getCorsOrigin(authorization.access));
    }

    const data = await getCachedList(
      searchParams.get('kelas') || undefined,
      searchParams.get('mata_kuliah') || undefined
    );

    return jsonWithCors({ ok: true, data }, getCorsOrigin(authorization.access));
  } catch (error) {
    return errorResponse(error, 'GET /api/praktikan error:');
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB']);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const input = body.rows ?? body.data ?? body;

    const result = await createPraktikan(input);
    revalidateTag('praktikan', { expire: 0 });
    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'POST /api/praktikan error:');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB']);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const id = body.id;
    const input = body.data ?? body;

    const data = await updatePraktikan(id, input);
    revalidateTag('praktikan', { expire: 0 });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return errorResponse(error, 'PUT /api/praktikan error:');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB']);
    if (!guard.ok) return guard.response;

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const kelas = searchParams.get('kelas');
    const action = searchParams.get('action');

    if (action === 'deleteAll') {
      const data = await deleteAllPraktikan();
      revalidateTag('praktikan', { expire: 0 });
      return NextResponse.json({ ok: true, data });
    }

    if (kelas) {
      const data = await deletePraktikanByKelas(kelas);
      revalidateTag('praktikan', { expire: 0 });
      return NextResponse.json({ ok: true, data });
    }

    if (id) {
      await deletePraktikan(id);
      revalidateTag('praktikan', { expire: 0 });
      return NextResponse.json({ ok: true, data: null });
    }

    const body = await request.json().catch(() => ({}));

    if (body.kelas) {
      const data = await deletePraktikanByKelas(body.kelas);
      revalidateTag('praktikan', { expire: 0 });
      return NextResponse.json({ ok: true, data });
    }

    await deletePraktikan(body.id);
    revalidateTag('praktikan', { expire: 0 });
    return NextResponse.json({ ok: true, data: null });
  } catch (error) {
    return errorResponse(error, 'DELETE /api/praktikan error:');
  }
}
