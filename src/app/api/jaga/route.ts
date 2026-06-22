import { NextResponse } from 'next/server';
import {
  getJadwalJaga,
  upsertJadwalJaga,
  deleteJadwalJaga,
  updateJadwalJaga,
  bulkUpsertJadwalJaga,
  bulkDeleteJadwalJaga,
} from '@/services/jagaService';
import { createClient } from '@/lib/supabase/server';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    // Read access: any authenticated user (RLS scopes rows to authenticated).
    const guard = await requireRoleApi(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');
    const modul = searchParams.get('modul');
    const hari = searchParams.get('hari');

    if (!term) {
      return NextResponse.json({ error: 'Term parameter is required' }, { status: 400 });
    }

    const data = await getJadwalJaga(term, modul ? parseInt(modul) : undefined, hari || undefined);
    return NextResponse.json({ data });
  } catch (err) {
    return apiErrorResponse(err, 'GET /api/jaga');
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB']);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const supabase = await createClient();

    const { action, id_asprak, tahun_ajaran, moduls, hari, shift } = body;

    if (action === 'bulk-upsert') {
      await bulkUpsertJadwalJaga(id_asprak, tahun_ajaran, moduls, hari, shift);
      return NextResponse.json({ success: true, message: 'Bulk jadwal jaga berhasil ditambahkan' });
    }

    await upsertJadwalJaga(body);
    return NextResponse.json({ success: true, message: 'Jadwal jaga berhasil ditambahkan' });
  } catch (err) {
    return apiErrorResponse(err, 'POST /api/jaga');
  }
}

export async function PUT(request: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB']);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const { id, ...input } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    await updateJadwalJaga(id, input);
    return NextResponse.json({ success: true, message: 'Jadwal jaga berhasil diperbarui' });
  } catch (err) {
    return apiErrorResponse(err, 'PUT /api/jaga');
  }
}

export async function DELETE(request: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB']);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    const supabase = await createClient();

    if (action === 'bulk-delete') {
      const id_asprak = searchParams.get('id_asprak');
      const tahun_ajaran = searchParams.get('tahun_ajaran');
      const modulsStr = searchParams.get('moduls');
      const hari = searchParams.get('hari');
      const shift = searchParams.get('shift');

      if (!id_asprak || !tahun_ajaran || !modulsStr || !hari || !shift) {
        return NextResponse.json({ error: 'Missing parameters for bulk delete' }, { status: 400 });
      }

      const moduls = modulsStr.split(',').map((m) => parseInt(m));
      await bulkDeleteJadwalJaga(id_asprak, tahun_ajaran, moduls, hari, parseInt(shift));
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await deleteJadwalJaga(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiErrorResponse(err, 'DELETE /api/jaga');
  }
}
