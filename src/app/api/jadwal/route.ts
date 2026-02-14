import { NextResponse } from 'next/server';
import * as jadwalService from '@/services/jadwalService';
import { logger } from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const term = searchParams.get('term');

    if (action === 'terms') {
      const terms = await jadwalService.getAvailableTerms();
      return NextResponse.json({ ok: true, data: terms });
    }

    if (action === 'by-term' && term) {
      const jadwal = await jadwalService.getJadwalByTerm(term);
      return NextResponse.json({ ok: true, data: jadwal });
    }

    if (action === 'today') {
      const limit = parseInt(searchParams.get('limit') || '5');
      const term = searchParams.get('term');
      // Pass the term (or undefined) to the service
      const jadwal = await jadwalService.getTodaySchedule(limit, term || undefined);
      return NextResponse.json({ ok: true, data: jadwal });
    }

    if (action === 'pengganti') {
        const modul = parseInt(searchParams.get('modul') || '0');
        const jadwal = await jadwalService.getJadwalPengganti(modul);
        return NextResponse.json({ ok: true, data: jadwal });
    }

    return NextResponse.json(
      { ok: false, error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error: any) {
    logger.error('API Error in /api/jadwal:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const body = await req.json();

    if (action === 'upsert-pengganti') {
        const result = await jadwalService.upsertJadwalPengganti(body);
        return NextResponse.json({ ok: true, data: result });
    }

    const jadwal = await jadwalService.createJadwal(body);
    return NextResponse.json({ ok: true, data: jadwal });
  } catch (error: any) {
    logger.error('API Error in POST /api/jadwal:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const jadwal = await jadwalService.updateJadwal(body);
    return NextResponse.json({ ok: true, data: jadwal });
  } catch (error: any) {
    logger.error('API Error in PUT /api/jadwal:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id parameter' }, { status: 400 });
    }

    await jadwalService.deleteJadwal(parseInt(id));
    return NextResponse.json({ ok: true, data: null });
  } catch (error: any) {
    logger.error('API Error in DELETE /api/jadwal:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
