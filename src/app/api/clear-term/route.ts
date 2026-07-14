import { NextResponse } from 'next/server';
import { clearDataByTerm } from '@/services/databaseService';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';

export async function POST(req: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN']);
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const { term } = body;

    if (!term || typeof term !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Parameter term tidak valid atau tidak ditemukan' },
        { status: 400 }
      );
    }

    await clearDataByTerm(term);

    return NextResponse.json({ ok: true, message: `Berhasil menghapus seluruh data untuk tahun ajaran ${term}` });
  } catch (err) {
    return apiErrorResponse(err, 'POST /api/clear-term');
  }
}
