import { NextRequest, NextResponse } from 'next/server';

import { requireRoleApi } from '@/lib/auth';
import {
  createPraktikan,
  deletePraktikan,
  deletePraktikanByKelas,
  getPraktikanList,
  getPraktikanOptions,
  updatePraktikan,
} from '@/services/praktikanService';
import {
  ensurePraktikanGetAccess,
  errorResponse,
  getCorsOrigin,
  jsonWithCors,
  praktikanOptionsResponse,
} from './_access';

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
      const data = await getPraktikanOptions();
      return jsonWithCors({ ok: true, data }, getCorsOrigin(authorization.access));
    }

    const data = await getPraktikanList({
      kelas: searchParams.get('kelas') || undefined,
      mata_kuliah: searchParams.get('mata_kuliah') || undefined,
    });

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

    if (kelas) {
      const data = await deletePraktikanByKelas(kelas);
      return NextResponse.json({ ok: true, data });
    }

    if (id) {
      await deletePraktikan(id);
      return NextResponse.json({ ok: true, data: null });
    }

    const body = await request.json().catch(() => ({}));

    if (body.kelas) {
      const data = await deletePraktikanByKelas(body.kelas);
      return NextResponse.json({ ok: true, data });
    }

    await deletePraktikan(body.id);
    return NextResponse.json({ ok: true, data: null });
  } catch (error) {
    return errorResponse(error, 'DELETE /api/praktikan error:');
  }
}
