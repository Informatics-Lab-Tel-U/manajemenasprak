import { NextResponse } from 'next/server';
import { getJadwalJaga, upsertJadwalJaga, deleteJadwalJaga } from '@/services/jagaService';
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

    await upsertJadwalJaga(body);
    return NextResponse.json({ success: true, message: 'Jadwal jaga berhasil ditambahkan' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteJadwalJaga(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
