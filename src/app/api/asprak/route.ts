/**
 * Asprak API Route
 * HTTP adapter that calls asprakService
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as asprakService from '@/services/asprakService';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await requireRole(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    const supabase = await createClient();
    const url = new URL(req.url);
    const params = url.searchParams;
    const action = params.get('action');
    const term = params.get('term') || undefined;

    if (action === 'plotting') {
      const data = await asprakService.getAspraksWithAssignments(term, supabase);
      return NextResponse.json({ ok: true, data });
    }

    if (action === 'codes') {
      const codes = await asprakService.getExistingCodes(supabase);
      return NextResponse.json({ ok: true, data: codes });
    }

    if (action === 'terms') {
      const terms = await asprakService.getAvailableTerms(supabase);
      return NextResponse.json({ ok: true, data: terms });
    }

    const data = await asprakService.getAllAsprak(term, supabase);
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    logger.error('GET /api/asprak error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireRole(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    const supabase = await createClient();
    const body = await req.json();
    const { action } = body;

    // Restriction: coordinators can only 'view'
    if (user.pengguna.role === 'ASPRAK_KOOR' && action !== 'view') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    switch (action) {
      case 'upsert': {
        const asprakId = await asprakService.upsertAsprak(body.data, supabase);
        return NextResponse.json({ ok: true, data: { asprakId } });
      }
      case 'view': {
        const assignments = await asprakService.getAsprakAssignments(body.asprakId, supabase);
        return NextResponse.json({ ok: true, data: assignments });
      }
      case 'bulk-import': {
        const result = await asprakService.bulkUpsertAspraks(body.rows, supabase);
        return NextResponse.json({ ok: true, data: result });
      }
      case 'update-assignments': {
        const { asprakId, term, praktikumIds } = body;
        await asprakService.updateAsprakAssignments(asprakId, term, praktikumIds, supabase);
        return NextResponse.json({ ok: true, data: null });
      }
      case 'check-nim': {
          const exists = await asprakService.checkNimExists(body.nim, supabase);
          return NextResponse.json({ ok: true, data: { exists } });
      }
      case 'generate-code': {
          const result = await asprakService.generateUniqueCode(body.name, supabase);
          return NextResponse.json({ ok: true, data: result });
      }
      default:
        return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (e: any) {
    logger.error('POST /api/asprak error:', e);
    const status = e.message.includes('conflict') ? 409 : 500;
    return NextResponse.json({ ok: false, error: e.message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireRole(['ADMIN']);
    const supabase = await createClient();
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID is required' }, { status: 400 });
    }

    await asprakService.deleteAsprak(id, supabase);

    const { createAuditLog } = await import('@/services/server/auditLogService');
    await createAuditLog('Asprak', id, 'DELETE');

    return NextResponse.json({ ok: true, data: null });
  } catch (e: any) {
    logger.error('DELETE /api/asprak error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

