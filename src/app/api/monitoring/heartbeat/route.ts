import { forwardToHono } from '@/lib/apiProxy';
import { NextRequest, NextResponse } from 'next/server';

export const fetchCache = 'force-no-store';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-praktikan-api-key',
    },
  });
}

export async function POST(request: NextRequest) {
  return forwardToHono(request, '/monitoring/heartbeat');
}
