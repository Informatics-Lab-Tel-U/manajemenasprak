import { NextResponse } from 'next/server';
import { getAvailableTerms as getAvailableTahunAjaran } from '@/services/termService';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';

export async function GET() {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB']);
    if (!guard.ok) return guard.response;

    const data = await getAvailableTahunAjaran();

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (err: any) {
    return apiErrorResponse(err, 'GET /api/tahun-ajaran', { status: err.status || 500 });
  }
}
