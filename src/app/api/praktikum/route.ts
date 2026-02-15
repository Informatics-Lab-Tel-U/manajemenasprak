import { NextResponse } from 'next/server';
import * as praktikumService from '@/services/praktikumService';
import { logger } from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'all') {
      const praktikum = await praktikumService.getAllPraktikum();
      return NextResponse.json({ ok: true, data: praktikum });
    }

    if (action === 'names') {
      const names = await praktikumService.getUniquePraktikumNames();
      return NextResponse.json({ ok: true, data: names });
    }

    if (action === 'mata-kuliah') {
      const mk = await praktikumService.getAllMataKuliah();
      return NextResponse.json({ ok: true, data: mk });
    }

    if (action === 'by-term') {
        const term = searchParams.get('term') || undefined;
        const data = await praktikumService.getPraktikumByTerm(term);
        return NextResponse.json({ ok: true, data });
    }

    if (action === 'details') {
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ ok: false, error: 'Missing id param' }, { status: 400 });
        const data = await praktikumService.getPraktikumDetails(id);
        return NextResponse.json({ ok: true, data });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('API Error in /api/praktikum:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, nama, tahunAjaran } = body;

    if (action === 'get-or-create' && nama && tahunAjaran) {
      const praktikum = await praktikumService.getOrCreatePraktikum(nama, tahunAjaran);
      return NextResponse.json({ ok: true, data: praktikum });
    }

    if (action === 'bulk-import' && body.rows) {
      const result = await praktikumService.bulkUpsertPraktikum(body.rows);
      return NextResponse.json({ ok: true, data: result });
    }

    return NextResponse.json(
      { ok: false, error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error: any) {
    logger.error('API Error in /api/praktikum POST:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
