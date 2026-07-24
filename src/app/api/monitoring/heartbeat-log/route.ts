import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const labId = searchParams.get('lab_id');
    const range = searchParams.get('range') || '1h';

    // Parse range to milliseconds
    let rangeMs = 60 * 60 * 1000; // default 1h
    if (range === '30m') rangeMs = 30 * 60 * 1000;
    else if (range === '1h') rangeMs = 60 * 60 * 1000;
    else if (range === '3h') rangeMs = 3 * 60 * 60 * 1000;
    else if (range === '6h') rangeMs = 6 * 60 * 60 * 1000;
    else if (range === '24h') rangeMs = 24 * 60 * 60 * 1000;

    const fromDate = new Date(Date.now() - rangeMs).toISOString();
    const supabaseAdmin = createAdminClient();

    let query = supabaseAdmin
      .from('monitoring_heartbeat_log')
      .select('*')
      .gte('created_at', fromDate)
      .order('created_at', { ascending: true })
      .limit(2000);

    if (labId) {
      query = query.eq('lab_id', labId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch heartbeat log:', error);
      return NextResponse.json(
        { error: 'Failed to read from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('Exception in heartbeat-log route:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
