/**
 * Asprak API Route
 * HTTP adapter that calls asprakService
 */

import { NextResponse } from 'next/server';
import * as asprakService from '@/services/asprakService';
import { logger } from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const action = params.get('action');
    const term = params.get('term') || undefined;

    if (action === 'plotting') {
      const data = await asprakService.getAspraksWithAssignments(term);
      return NextResponse.json({ data });
    }

    if (action === 'codes') {
      const codes = await asprakService.getExistingCodes();
      return NextResponse.json({ codes });
    }

    if (action === 'terms') {
      const terms = await asprakService.getAvailableTerms();
      return NextResponse.json({ terms });
    }

    const data = await asprakService.getAllAsprak(term);
    return NextResponse.json({ data });
  } catch (e: any) {
    logger.error('GET /api/asprak error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'upsert': {
        const asprakId = await asprakService.upsertAsprak(body.data);
        return NextResponse.json({ success: true, asprakId });
      }
      case 'view': {
        const assignments = await asprakService.getAsprakAssignments(body.asprakId);
        return NextResponse.json({ assignments });
      }
      case 'bulk-import': {
        const result = await asprakService.bulkUpsertAspraks(body.rows);
        return NextResponse.json({ success: true, result });
      }
      case 'update-assignments': {
        const { asprakId, term, praktikumIds } = body;
        await asprakService.updateAsprakAssignments(asprakId, term, praktikumIds);
        return NextResponse.json({ success: true });
      }
      case 'check-nim': {
          const exists = await asprakService.checkNimExists(body.nim);
          return NextResponse.json({ exists });
      }
      case 'generate-code': {
          const result = await asprakService.generateUniqueCode(body.name);
          return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (e: any) {
    logger.error('POST /api/asprak error:', e);
    const status = e.message.includes('conflict') ? 409 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await asprakService.deleteAsprak(id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    logger.error('DELETE /api/asprak error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
