import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as plottingService from '@/services/plottingService';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await requireRole(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']); // Plotting can be viewed by Koor
    const supabase = await createClient();
    const url = new URL(req.url);
    const term = url.searchParams.get('term') || undefined;
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '1000'); // Default high for client side pagination if needed

    // If we use server side pagination:
    // const result = await plottingService.getPlottingList(page, limit, term);
    
    // But currently frontend uses grouped data from asprakService?
    // User requested "pagination like asprak page". Asprak page fetches ALL and client paginates.
    // So we can return ALL here or use the existing asprakService.
    
    // Actually, let's expose the service we created (getPlottingList) which returns FLAT assignment rows.
    // This might be different from grouped view.
    // If the table should look like AsprakTable (Row = Asprak), we should fetch aggregated.
    // getPlottingList returns Row = Assignment.
    
    // If we want Row = Asprak (with assignments inside), we need aggregation.
    // PlottingPage currently uses fetchPlottingData -> calls asprakService.getAspraksWithAssignments.
    
    // I will stick to getAspraksWithAssignments logic but move it here? 
    // Or just use this route for Transactional/Validation stuff.
    // User asked "plotting page ... turunan sidebar ... input manual ... import csv ... validasi".
    
    // Let's implement validation actions here.
    return NextResponse.json({ message: "Use action POST for validation" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(['ADMIN', 'ASLAB']);
    const supabase = await createClient();
    const body = await req.json();
    const { action } = body;

    if (action === 'validate-import') {
        const { rows, term } = body; // rows: { kode_asprak, mk_singkat }[]
        const result = await plottingService.validatePlottingImport(rows, term, supabase);
        return NextResponse.json(result);
    }
    
    if (action === 'save-plotting') {
        const { assignments } = body; // { asprak_id, praktikum_id }[]
        await plottingService.savePlotting(assignments, supabase);

        const { createAuditLog } = await import('@/services/server/auditLogService');
        await createAuditLog('Plotting', 'BULK', 'SAVE_PLOTTING', { count: assignments.length });

        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    logger.error('POST /api/plotting error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

