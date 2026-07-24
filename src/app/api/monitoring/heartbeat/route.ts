export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Setup CORS headers to allow requests from the generator-kursi worker
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-praktikan-api-key',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const providedKey = request.headers.get('x-praktikan-api-key')?.trim();
    const expectedKey = (process.env.PRAKTIKAN_GET_API_KEY ?? '').trim();

    if (!expectedKey || providedKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { lab_id, kelas, status, response_time_ms } = body;

    if (!lab_id || !kelas) {
      return NextResponse.json(
        { error: 'Missing lab_id or kelas' },
        { status: 400, headers: corsHeaders }
      );
    }

    let parsedResponseTime: number | null = null;
    if (typeof response_time_ms === 'number' && Number.isFinite(response_time_ms) && response_time_ms >= 0) {
      parsedResponseTime = response_time_ms;
    }

    const now = new Date().toISOString();

    const dataToStore = {
      lab_id,
      kelas,
      status: status || 'online',
      last_seen: now
    };

    const logData = {
      lab_id,
      kelas,
      status: status || 'online',
      response_time_ms: parsedResponseTime,
      created_at: now
    };

    const supabaseAdmin = createAdminClient();
    
    const [upsertResult, insertResult] = await Promise.all([
      supabaseAdmin
        .from('monitoring_lab')
        // @ts-expect-error Type inference misses Database schema
        .upsert(dataToStore, { onConflict: 'lab_id' }),
      supabaseAdmin
        .from('monitoring_heartbeat_log')
        // @ts-expect-error Type inference misses Database schema
        .insert(logData)
    ]);

    if (upsertResult.error) {
      console.error('Failed to upsert to Supabase:', upsertResult.error);
      return NextResponse.json(
        { error: 'Failed to write to database' },
        { status: 500, headers: corsHeaders }
      );
    }

    if (insertResult.error) {
      console.error('Failed to insert heartbeat log:', insertResult.error);
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Exception in heartbeat route:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error', stack: err.stack },
      { status: 500, headers: corsHeaders }
    );
  }
}
