import { NextResponse } from 'next/server';
import { 
  getJadwalJaga, 
  upsertJadwalJaga, 
  deleteJadwalJaga, 
  updateJadwalJaga,
  bulkUpsertJadwalJaga,
  bulkDeleteJadwalJaga
} from '@/services/jagaService';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');
    const modul = searchParams.get('modul');
    const hari = searchParams.get('hari');

    if (!term) {
      return NextResponse.json({ error: 'Term parameter is required' }, { status: 400 });
    }

    const data = await getJadwalJaga(term, modul ? parseInt(modul) : undefined, hari || undefined);
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, id_asprak, tahun_ajaran, moduls, hari, shift } = body;

    if (action === 'bulk-upsert') {
      await bulkUpsertJadwalJaga(id_asprak, tahun_ajaran, moduls, hari, shift);
      return NextResponse.json({ success: true, message: 'Bulk jadwal jaga berhasil ditambahkan' });
    }

    await upsertJadwalJaga(body);
    return NextResponse.json({ success: true, message: 'Jadwal jaga berhasil ditambahkan' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...input } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await updateJadwalJaga(id, input);
    return NextResponse.json({ success: true, message: 'Jadwal jaga berhasil diperbarui' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'bulk-delete') {
      const id_asprak = searchParams.get('id_asprak');
      const tahun_ajaran = searchParams.get('tahun_ajaran');
      const modulsStr = searchParams.get('moduls');
      const hari = searchParams.get('hari');
      const shift = searchParams.get('shift');

      if (!id_asprak || !tahun_ajaran || !modulsStr || !hari || !shift) {
        return NextResponse.json({ error: 'Missing parameters for bulk delete' }, { status: 400 });
      }

      const moduls = modulsStr.split(',').map(m => parseInt(m));
      await bulkDeleteJadwalJaga(id_asprak, tahun_ajaran, moduls, hari, parseInt(shift));
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await deleteJadwalJaga(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
