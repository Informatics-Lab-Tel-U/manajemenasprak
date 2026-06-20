import { NextResponse } from 'next/server';
import { getRekapJagaAggregated } from '@/services/jagaService';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB']);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');

    if (!term) {
      return NextResponse.json({ error: 'Term parameter is required' }, { status: 400 });
    }

    const data = await getRekapJagaAggregated(term);
    return NextResponse.json({ data });
  } catch (err) {
    return apiErrorResponse(err, 'GET /api/jaga/rekap');
  }
}
