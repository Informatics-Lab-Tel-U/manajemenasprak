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
