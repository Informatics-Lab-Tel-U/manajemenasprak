import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStats } from '@/services/databaseService';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    if (!guard.ok) return guard.response;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term') || undefined;

    const stats = await getStats(term, supabase);

    return NextResponse.json({ ok: true, data: stats });
  } catch (err) {
    return apiErrorResponse(err, 'GET /api/stats');
  }
}
