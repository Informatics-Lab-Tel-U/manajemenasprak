import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Setup CORS headers to allow requests from the generator-kursi worker
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lab_id, kelas, status } = body;

    if (!lab_id || !kelas) {
      return NextResponse.json(
        { error: 'Missing lab_id or kelas' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { env } = await getCloudflareContext({ async: true });
    const kv = (env as any).MONITORING_KV;

    if (!kv) {
      console.error('MONITORING_KV is not bound!');
      return NextResponse.json(
        { error: 'KV Binding missing' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Set TTL to 150 seconds (2.5 minutes)
    // Cloudflare KV TTL must be at least 60 seconds.
    const expirationTtl = 150; 

    const dataToStore = JSON.stringify({
      kelas,
      status: status || 'online',
      last_seen: new Date().toISOString()
    });

    await kv.put(lab_id, dataToStore, { expirationTtl });

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Exception in heartbeat route:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
