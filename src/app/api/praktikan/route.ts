import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import {
  createPraktikan,
  deletePraktikan,
  deletePraktikanByKelas,
  getPraktikanList,
  updatePraktikan,
} from '@/services/praktikanService';

function errorResponse(error: unknown, context: string) {
  logger.error(context, error);
  const message = error instanceof Error ? error.message : 'Internal server error';
  const status = message.includes('wajib diisi') || message.includes('Tidak ada data') ? 400 : 500;

  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const data = await getPraktikanList(
      {
        kelas: searchParams.get('kelas') || undefined,
        mata_kuliah: searchParams.get('mata_kuliah') || undefined,
      },
      supabase
    );

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return errorResponse(error, 'GET /api/praktikan error:');
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['ADMIN', 'ASLAB']);
    const supabase = await createClient();
    const body = await request.json();
    const input = body.rows ?? body.data ?? body;

    const result = await createPraktikan(input, supabase);
    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'POST /api/praktikan error:');
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole(['ADMIN', 'ASLAB']);
    const supabase = await createClient();
    const body = await request.json();
    const id = body.id;
    const input = body.data ?? body;

    const data = await updatePraktikan(id, input, supabase);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return errorResponse(error, 'PUT /api/praktikan error:');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole(['ADMIN', 'ASLAB']);
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const kelas = searchParams.get('kelas');

    if (kelas) {
      const data = await deletePraktikanByKelas(kelas, supabase);
      return NextResponse.json({ ok: true, data });
    }

    if (id) {
      await deletePraktikan(id, supabase);
      return NextResponse.json({ ok: true, data: null });
    }

    const body = await request.json().catch(() => ({}));

    if (body.kelas) {
      const data = await deletePraktikanByKelas(body.kelas, supabase);
      return NextResponse.json({ ok: true, data });
    }

    await deletePraktikan(body.id, supabase);
    return NextResponse.json({ ok: true, data: null });
  } catch (error) {
    return errorResponse(error, 'DELETE /api/praktikan error:');
  }
}
