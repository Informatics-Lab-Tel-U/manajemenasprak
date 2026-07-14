import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as pelanggaranService from '@/services/pelanggaranService';
import * as praktikumService from '@/services/praktikumService';
import { apiErrorResponse } from '@/lib/api-error';

import { requireRoleApi } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    if (!guard.ok) return guard.response;

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

      if (isKoor) {
        // Gunakan user.id sendiri jika role ASPRAK_KOOR, abaikan userId query string (Cegah IDOR Temuan 3)
        const effectiveUserId = guard.user.pengguna.role === 'ASPRAK_KOOR' ? guard.user.id : userId;
        
        if (!effectiveUserId) {
          return NextResponse.json({ ok: false, error: 'Missing userId' }, { status: 400 });
        }

        const praktikumList = await pelanggaranService.getKoorPraktikumList(effectiveUserId, supabase);
        return NextResponse.json({ ok: true, data: praktikumList });
      }
      return NextResponse.json(
        { ok: false, error: 'Unauthorized or missing params' },
        { status: 400 }
      );
    }

    if (action === 'praktikum-detail' && idPraktikum) {
      const praktikum = await praktikumService.getPraktikumById(idPraktikum, supabase);
      if (!praktikum) {
        return NextResponse.json(
          { ok: false, error: 'Praktikum tidak ditemukan' },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, data: praktikum });
    }

    if (action === 'jadwal-list') {
      const jadwalList = await pelanggaranService.getJadwalForPelanggaran(supabase);
      return NextResponse.json({ ok: true, data: jadwalList });
    }

    if (action === 'finalized-modules' && idPraktikum) {
      const modules = await pelanggaranService.getFinalizedModules(idPraktikum);
      return NextResponse.json({ ok: true, data: modules });
    }

    // Check for 'summary' BEFORE the generic tahunAjaran filter
    if (action === 'summary') {
      const summaryGuard = await requireRoleApi(['ADMIN', 'ASLAB']);
      if (!summaryGuard.ok) return summaryGuard.response;

      if (!tahunAjaran) {
        return NextResponse.json({ ok: false, error: 'Missing tahunAjaran' }, { status: 400 });
      }
      const minCount = searchParams.get('minCount') ? Number(searchParams.get('minCount')) : 1;
      const modulParam = searchParams.get('modul') ? Number(searchParams.get('modul')) : undefined;

      const summary = await pelanggaranService.getPelanggaranSummary(
        tahunAjaran,
        modulParam,
        minCount,
        supabase
      );
      return NextResponse.json({ ok: true, data: summary });
    }

    // Use already declared search parameters if no action above matched
    const finalIdPraktikum = idPraktikum || undefined;
    const finalTahunAjaran = tahunAjaran || undefined;

    if (finalIdPraktikum || finalTahunAjaran) {
      const pelanggaran = await pelanggaranService.getPelanggaranByFilter(
        finalIdPraktikum,
        finalTahunAjaran,
        supabase
      );
      return NextResponse.json({ ok: true, data: pelanggaran });
    }

    const pelanggaran = await pelanggaranService.getAllPelanggaran(supabase);
    return NextResponse.json({ ok: true, data: pelanggaran });
  } catch (err) {
    return apiErrorResponse(err, 'GET /api/pelanggaran');
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

    // --- Finalize per praktikum ---
    if (action === 'finalize') {
      const { id_praktikum } = body;

      if (!id_praktikum) {
        return NextResponse.json({ ok: false, error: 'Missing id_praktikum' }, { status: 400 });
      }

      // Validasi hak akses untuk ASPRAK_KOOR (Mencegah IDOR Temuan 2)
      if (user.pengguna.role === 'ASPRAK_KOOR') {
        const allowedPraktikum = await pelanggaranService.getKoorPraktikumList(user.id, supabase);
        if (!allowedPraktikum.some(p => p.id === id_praktikum)) {
          return NextResponse.json({ ok: false, error: 'Unauthorized: id_praktikum tidak valid' }, { status: 403 });
        }
      }

      await pelanggaranService.finalizePelanggaranByPraktikum(id_praktikum, user.id);

      return NextResponse.json({ ok: true });
    }

    // --- Unfinalize (RESET) ---
    if (action === 'unfinalize') {
      // Ensure strictly ADMIN
      if (user.pengguna.role !== 'ADMIN') {
        return NextResponse.json(
          { ok: false, error: 'Hanya Admin yang dapat mereset finalisasi' },
          { status: 403 }
        );
      }

      const { id_praktikum } = body;
      if (!id_praktikum) {
        return NextResponse.json({ ok: false, error: 'Missing id_praktikum' }, { status: 400 });
      }

      await pelanggaranService.unfinalizePelanggaranByPraktikum(id_praktikum);

      return NextResponse.json({ ok: true });
    }

    if (action === 'finalize-modul') {
      const { id_praktikum, modul } = body;
      if (!id_praktikum || modul === undefined) {
        return NextResponse.json(
          { ok: false, error: 'Missing id_praktikum or modul' },
          { status: 400 }
        );
      }

      // Validasi hak akses untuk ASPRAK_KOOR (Mencegah IDOR Temuan 2)
      if (user.pengguna.role === 'ASPRAK_KOOR') {
        const allowedPraktikum = await pelanggaranService.getKoorPraktikumList(user.id, supabase);
        if (!allowedPraktikum.some(p => p.id === id_praktikum)) {
          return NextResponse.json({ ok: false, error: 'Unauthorized: id_praktikum tidak valid' }, { status: 403 });
        }
      }

      await pelanggaranService.finalizePelanggaranByModul(id_praktikum, Number(modul), user.id);

      return NextResponse.json({ ok: true });
    }

    if (action === 'unfinalize-modul') {
      if (user.pengguna.role !== 'ADMIN') {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
      }
      const { id_praktikum, modul } = body;
      if (!id_praktikum || modul === undefined) {
        return NextResponse.json(
          { ok: false, error: 'Missing id_praktikum or modul' },
          { status: 400 }
        );
      }
      await pelanggaranService.unfinalizePelanggaranByModul(id_praktikum, Number(modul));

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

      return NextResponse.json({ ok: true, data: pelanggaran });
    }

    // Bulk create for multiple asprak
    const inputs = asprakIds.map((id) => ({ id_asprak: id, id_jadwal, jenis, modul }));
    const results = await pelanggaranService.bulkCreatePelanggaran(inputs, supabase);

    return NextResponse.json({ ok: true, data: results });
  } catch (err) {
    return apiErrorResponse(err, 'POST /api/pelanggaran');
  }
}

export async function DELETE(req: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    if (!guard.ok) return guard.response;

    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id parameter' }, { status: 400 });
    }

    await pelanggaranService.deletePelanggaran(id, supabase);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err, 'DELETE /api/pelanggaran');
  }
}
