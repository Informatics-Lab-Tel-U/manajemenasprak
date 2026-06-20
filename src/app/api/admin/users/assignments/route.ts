import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';

/**
 * GET /api/admin/users/assignments?id_pengguna=<uuid>
 * Fetch asprak_koordinator records for a given user.
 * Join with praktikum to include nama + tahun_ajaran.
 * Admin only.
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireRoleApi(['ADMIN']);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const idPengguna = searchParams.get('id_pengguna');

    if (!idPengguna) {
      return NextResponse.json({ ok: false, error: 'id_pengguna diperlukan.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Join asprak_koordinator with praktikum to get nama & tahun_ajaran
    const { data, error } = await admin
      .from('asprak_koordinator')
      .select(
        `
        id_praktikum,
        is_active,
        praktikum:praktikum (
          id,
          nama,
          tahun_ajaran
        )
      `
      )
      .eq('id_pengguna', idPengguna)
      .eq('is_active', true);

    if (error) throw error;

    // Flatten so caller gets: { id_praktikum, tahun_ajaran, nama_praktikum }
    const result = (data ?? []).map((r: any) => ({
      id_praktikum: r.id_praktikum,
      tahun_ajaran: r.praktikum?.tahun_ajaran ?? '',
      nama_praktikum: r.praktikum?.nama ?? '',
    }));

    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    return apiErrorResponse(err, 'GET /api/admin/users/assignments');
  }
}
