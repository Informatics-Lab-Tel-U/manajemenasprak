import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStats } from '@/services/databaseService';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term') || '2425-1';

    const stats = await getStats(term, supabase);

    return NextResponse.json({ ok: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
