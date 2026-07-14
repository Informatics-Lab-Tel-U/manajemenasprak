import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';

/**
 * Fetch-only endpoint used by the onboarding wizard's "copy" mode.
 * Reads Praktikum + Mata Kuliah for a source term so the wizard can
 * show a preview before anything is written to the database. No inserts
 * happen here — the actual write only occurs at the Preview step via
 * /api/tahun-ajaran/onboard.
 */
export async function GET(req: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB']);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const sourceTerm = searchParams.get('sourceTerm');

    if (!sourceTerm) {
      return NextResponse.json({ ok: false, error: 'sourceTerm harus diisi' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: praktikumRows, error: praktikumError } = await supabase
      .from('praktikum')
      .select('id, nama, tahun_ajaran')
      .eq('tahun_ajaran', sourceTerm)
      .order('nama');

    if (praktikumError) throw praktikumError;

    if (!praktikumRows || praktikumRows.length === 0) {
      return NextResponse.json({
        ok: true,
        data: { praktikumList: [], mataKuliahList: [] },
      });
    }

    const praktikumIds = praktikumRows.map((p) => p.id);

    const { data: mataKuliahRows, error: mataKuliahError } = await supabase
      .from('mata_kuliah')
      .select('id, id_praktikum, nama_lengkap, program_studi, dosen_koor')
      .in('id_praktikum', praktikumIds)
      .order('nama_lengkap');

    if (mataKuliahError) throw mataKuliahError;

    // Reshape with fresh tempIds so the wizard can merge this straight into
    // the draft shape used by StepPraktikum / StepMataKuliah.
    const praktikumIdToTempId = new Map<string, string>();
    const praktikumList = praktikumRows.map((p) => {
      const tempId = crypto.randomUUID();
      praktikumIdToTempId.set(p.id, tempId);
      return { tempId, nama: p.nama, tahun_ajaran: p.tahun_ajaran };
    });

    const mataKuliahList = (mataKuliahRows || []).map((mk) => ({
      nama_lengkap: mk.nama_lengkap,
      program_studi: mk.program_studi,
      dosen_koor: mk.dosen_koor || undefined,
      id_praktikum: praktikumIdToTempId.get(mk.id_praktikum) || '',
    }));

    return NextResponse.json({ ok: true, data: { praktikumList, mataKuliahList } });
  } catch (err: any) {
    return apiErrorResponse(err, 'GET /api/tahun-ajaran/prepare-copy');
  }
}
