import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as pelanggaranService from '@/services/pelanggaranService';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const supabase = await createClient();
    const pelanggaran = await pelanggaranService.getAllPelanggaran(supabase);
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
    const supabase = await createClient();
    const body = await req.json();
    const { action } = body;

    if (action === 'finalize') {
        const { id_mk } = body;
        if (!id_mk) return NextResponse.json({ ok: false, error: 'Missing id_mk' }, { status: 400 });
        await pelanggaranService.finalizePelanggaranByMataKuliah(id_mk, supabase);
        return NextResponse.json({ ok: true });
    }

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
    }, supabase);

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
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id parameter' }, { status: 400 });
    }

    await pelanggaranService.deletePelanggaran(id, supabase);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    logger.error('API Error in /api/pelanggaran DELETE:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
