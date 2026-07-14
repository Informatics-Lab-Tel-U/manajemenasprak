import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as plottingService from '@/services/plottingService';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';

export async function GET(_req: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    if (!guard.ok) return guard.response;

    return NextResponse.json({ message: 'Use action POST for validation' });
  } catch (err) {
    return apiErrorResponse(err, 'GET /api/plotting');
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB']);
    if (!guard.ok) return guard.response;

    const supabase = await createClient();
    const body = await req.json();
    const { action } = body;

    if (action === 'validate-import') {
      const { rows, term, pendingAspraks } = body; // rows: { kode_asprak, mk_singkat }[]
      const result = await plottingService.validatePlottingImport(rows, term, pendingAspraks, supabase);
      return NextResponse.json(result);
    }

    if (action === 'save-plotting') {
      const { assignments } = body; // { asprak_id, praktikum_id }[]
      await plottingService.savePlotting(assignments, supabase);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return apiErrorResponse(err, 'POST /api/plotting');
  }
}
