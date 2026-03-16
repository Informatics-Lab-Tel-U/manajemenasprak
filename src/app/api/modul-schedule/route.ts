import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth';
import {
  getModulScheduleByTerm,
  upsertModulScheduleForTerm,
  type ModulScheduleEntry,
} from '@/services/modulScheduleService';

export async function GET(req: Request) {
  try {
    await requireRole(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const term = searchParams.get('term');

    if (!term) {
      return NextResponse.json({ ok: false, error: 'Parameter term wajib diisi' }, { status: 400 });
    }

    const data = await getModulScheduleByTerm(term, supabase);
    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    logger.error('API Error in /api/modul-schedule (GET):', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
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
  } catch (error: any) {
    logger.error('API Error in /api/modul-schedule (POST):', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
