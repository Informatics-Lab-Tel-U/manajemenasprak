import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';
import {
  getModulScheduleByTerm,
  upsertModulScheduleForTerm,
  type ModulScheduleEntry,
} from '@/services/modulScheduleService';

export async function GET(req: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    if (!guard.ok) return guard.response;

    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const term = searchParams.get('term');

    if (!term) {
      return NextResponse.json({ ok: false, error: 'Parameter term wajib diisi' }, { status: 400 });
    }

    const data = await getModulScheduleByTerm(term, supabase);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return apiErrorResponse(err, 'GET /api/modul-schedule');
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    if (!guard.ok) return guard.response;

    const supabase = await createClient();
    const body = await req.json();

    const term = body?.term as string | undefined;
    const entries = body?.entries as ModulScheduleEntry[] | undefined;

    if (!term) {
      return NextResponse.json({ ok: false, error: 'Field term wajib diisi' }, { status: 400 });
    }
    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { ok: false, error: 'Field entries wajib berupa array' },
        { status: 400 }
      );
    }

    await upsertModulScheduleForTerm(term, entries, supabase);
    return NextResponse.json({ ok: true, data: null });
  } catch (err) {
    return apiErrorResponse(err, 'POST /api/modul-schedule');
  }
}
