import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as pelanggaranService from '@/services/pelanggaranService';
import * as praktikumService from '@/services/praktikumService';
import { logger } from '@/lib/logger';

import { requireRole } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await requireRole(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const idPraktikum = searchParams.get('idPraktikum');
    const tahunAjaran = searchParams.get('tahunAjaran');
    const userId = searchParams.get('userId');
    const isKoorParam = searchParams.get('isKoor');

    if (action === 'counts') {
      const isKoor = isKoorParam === 'true';
      const result = await pelanggaranService.getPelanggaranCountsByPraktikum(isKoor, supabase);
      return NextResponse.json({ ok: true, data: result });
    }

    if (action === 'praktikum-list') {
      const isKoor = isKoorParam === 'true';

      if (isKoor && userId) {
        const praktikumList = await pelanggaranService.getKoorPraktikumList(userId, supabase);
        return NextResponse.json({ ok: true, data: praktikumList });
      }
      return NextResponse.json({ ok: false, error: 'Unauthorized or missing params' }, { status: 400 });
    }

    if (action === 'praktikum-detail' && idPraktikum) {
      const praktikum = await praktikumService.getPraktikumById(idPraktikum, supabase);
      if (!praktikum) {
        return NextResponse.json({ ok: false, error: 'Praktikum tidak ditemukan' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, data: praktikum });
    }

    if (action === 'jadwal-list') {
      const jadwalList = await pelanggaranService.getJadwalForPelanggaran(supabase);
      return NextResponse.json({ ok: true, data: jadwalList });
    }

    // Use already declared search parameters if no action above matched
    const finalIdPraktikum = idPraktikum || undefined;
    const finalTahunAjaran = tahunAjaran || undefined;

    if (finalIdPraktikum || finalTahunAjaran) {
      const pelanggaran = await pelanggaranService.getPelanggaranByFilter(finalIdPraktikum, finalTahunAjaran, supabase);
      return NextResponse.json({ ok: true, data: pelanggaran });
    }

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
    await requireRole(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    const supabase = await createClient();
    const body = await req.json();
    const { action } = body;

    // --- Finalize per praktikum ---
    if (action === 'finalize') {
      const { id_praktikum, id_mk } = body;

      // Legacy: finalize by id_mk
      if (id_mk) {
        await pelanggaranService.finalizePelanggaranByMataKuliah(id_mk, supabase);
        return NextResponse.json({ ok: true });
      }

      if (!id_praktikum) {
        return NextResponse.json(
          { ok: false, error: 'Missing id_praktikum' },
          { status: 400 }
        );
      }
      await pelanggaranService.finalizePelanggaranByPraktikum(id_praktikum, supabase);

      const { createAuditLog } = await import('@/services/server/auditLogService');
      await createAuditLog('Pelanggaran', id_praktikum, 'FINALIZE_PRAKTIKUM');

      return NextResponse.json({ ok: true });
    }

    // --- Create single or multiple pelanggaran ---
    const { id_asprak, id_jadwal, jenis, modul } = body;

    if (!id_jadwal || !jenis) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: id_asprak, id_jadwal, jenis' },
        { status: 400 }
      );
    }

    // id_asprak can be a string (single) or array (multi-select)
    const asprakIds: string[] = Array.isArray(id_asprak) ? id_asprak : [id_asprak];

    if (asprakIds.length === 0) {
      return NextResponse.json({ ok: false, error: 'Missing id_asprak' }, { status: 400 });
    }

    if (asprakIds.length === 1) {
      const pelanggaran = await pelanggaranService.createPelanggaran(
        { id_asprak: asprakIds[0], id_jadwal, jenis, modul },
        supabase
      );

      const { createAuditLog } = await import('@/services/server/auditLogService');
      await createAuditLog('Pelanggaran', pelanggaran.id, 'CREATE', { id_asprak: asprakIds[0], id_jadwal, jenis, modul });

      return NextResponse.json({ ok: true, data: pelanggaran });
    }

    // Bulk create for multiple asprak
    const inputs = asprakIds.map((id) => ({ id_asprak: id, id_jadwal, jenis, modul }));
    const results = await pelanggaranService.bulkCreatePelanggaran(inputs, supabase);

    const { createAuditLog } = await import('@/services/server/auditLogService');
    await createAuditLog('Pelanggaran', 'BULK', 'CREATE', { count: results.length });

    return NextResponse.json({ ok: true, data: results });
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
    await requireRole(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id parameter' }, { status: 400 });
    }

    await pelanggaranService.deletePelanggaran(id, supabase);
    
    const { createAuditLog } = await import('@/services/server/auditLogService');
    await createAuditLog('Pelanggaran', id, 'DELETE');
    
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    logger.error('API Error in /api/pelanggaran DELETE:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
