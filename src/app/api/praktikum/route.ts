import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as praktikumService from '@/services/praktikumService';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';

export async function GET(req: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    if (!guard.ok) return guard.response;

    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'all') {
      const praktikum = await praktikumService.getAllPraktikum(supabase);
      return NextResponse.json({ ok: true, data: praktikum });
    }

    if (action === 'names') {
      const names = await praktikumService.getUniquePraktikumNames(supabase);
      return NextResponse.json({ ok: true, data: names });
    }

    if (action === 'mata-kuliah') {
      const mk = await praktikumService.getAllMataKuliah(supabase);
      return NextResponse.json({ ok: true, data: mk });
    }

    if (action === 'by-term') {
      const term = searchParams.get('term') || undefined;
      const data = await praktikumService.getPraktikumByTerm(term, supabase);
      return NextResponse.json({ ok: true, data });
    }

    if (action === 'details') {
      const id = searchParams.get('id');
      if (!id) return NextResponse.json({ ok: false, error: 'Missing id param' }, { status: 400 });
      const data = await praktikumService.getPraktikumDetails(id, supabase);
      return NextResponse.json({ ok: true, data });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return apiErrorResponse(err, 'GET /api/praktikum');
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB']);
    if (!guard.ok) return guard.response;

    const supabase = await createClient();
    const body = await req.json();
    const { action, nama, tahunAjaran } = body;

    if (action === 'get-or-create' && nama && tahunAjaran) {
      const praktikum = await praktikumService.getOrCreatePraktikum(nama, tahunAjaran, supabase);
      return NextResponse.json({ ok: true, data: praktikum });
    }

    if (action === 'bulk-import' && body.rows) {
      const result = await praktikumService.bulkUpsertPraktikum(body.rows, supabase);

      return NextResponse.json({ ok: true, data: result });
    }

    return NextResponse.json(
      { ok: false, error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (err) {
    return apiErrorResponse(err, 'POST /api/praktikum');
  }
}
