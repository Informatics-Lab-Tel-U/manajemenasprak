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
    const { lab_id, kelas, status } = body;

    if (!lab_id || !kelas) {
      return NextResponse.json(
        { error: 'Missing lab_id or kelas' },
        { status: 400, headers: corsHeaders }
      );
    }

    const dataToStore = {
      lab_id,
      kelas,
      status: status || 'online',
      last_seen: new Date().toISOString()
    };

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from('monitoring_lab')
      // @ts-expect-error Type inference misses Database schema
      .upsert(dataToStore, { onConflict: 'lab_id' });

    if (error) {
      console.error('Failed to upsert to Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to write to database' },
        { status: 500, headers: corsHeaders }
      );
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
