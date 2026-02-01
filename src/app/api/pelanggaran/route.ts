import { NextResponse } from 'next/server';
import * as pelanggaranService from '@/services/pelanggaranService';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const pelanggaran = await pelanggaranService.getAllPelanggaran();
    return NextResponse.json({ ok: true, data: pelanggaran });
  } catch (error: any) {
    logger.error('API Error in /api/pelanggaran:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id_asprak, id_jadwal, jenis, modul } = body;

    if (!id_asprak || !id_jadwal || !jenis) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: id_asprak, id_jadwal, jenis' },
        { status: 400 }
      );
    }

    const pelanggaran = await pelanggaranService.createPelanggaran({
      id_asprak,
      id_jadwal,
      jenis,
      modul,
    });

    return NextResponse.json({ ok: true, data: pelanggaran });
  } catch (error: any) {
    logger.error('API Error in /api/pelanggaran POST:', error);
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

    await pelanggaranService.deletePelanggaran(parseInt(id));
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    logger.error('API Error in /api/pelanggaran DELETE:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
