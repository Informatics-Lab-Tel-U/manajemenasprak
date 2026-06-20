/**
 * Asprak API Route
 * HTTP adapter that calls asprakService
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as asprakService from '@/services/asprakService';
import { getAvailableTerms } from '@/services/termService';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';

export async function GET(req: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    if (!guard.ok) return guard.response;

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
      const terms = await getAvailableTerms(supabase);
      return NextResponse.json({ ok: true, data: terms });
    }

    const data = await asprakService.getAllAsprak(term, supabase);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return apiErrorResponse(err, 'GET /api/asprak');
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    if (!guard.ok) return guard.response;
    const user = guard.user;

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
        const { asprakId, term, praktikumIds, newKode, nim, forceOverride } = body;
        await asprakService.updateAsprakAssignments(
          asprakId,
          term,
          praktikumIds,
          supabase,
          newKode,
          nim,
          forceOverride
        );
        return NextResponse.json({ ok: true, data: null });
      }
      case 'check-nim': {
        const exists = await asprakService.checkNimExists(body.nim, supabase);
        return NextResponse.json({ ok: true, data: { exists } });
      }
      case 'generate-code': {
        const result = await asprakService.generateUniqueCode(
          body.name,
          supabase,
          body.forceOverride
        );
        return NextResponse.json({ ok: true, data: result });
      }
      default:
        return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    const status = err.message?.includes('conflict') ? 409 : undefined;
    return apiErrorResponse(err, 'POST /api/asprak', status ? { status } : undefined);
  }
}

export async function DELETE(req: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN']);
    if (!guard.ok) return guard.response;

    const supabase = await createClient();
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID is required' }, { status: 400 });
    }

    await asprakService.deleteAsprak(id, supabase);

    return NextResponse.json({ ok: true, data: null });
  } catch (err) {
    return apiErrorResponse(err, 'DELETE /api/asprak');
  }
}
