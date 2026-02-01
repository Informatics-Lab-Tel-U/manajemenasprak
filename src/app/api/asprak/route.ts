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
    const action = url.searchParams.get('action');

    if (action === 'codes') {
      const codes = await asprakService.getExistingCodes();
      return NextResponse.json({ codes });
    }

    const data = await asprakService.getAllAsprak();
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
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (e: any) {
    logger.error('POST /api/asprak error:', e);
    const status = e.message.includes('conflict') ? 409 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}
