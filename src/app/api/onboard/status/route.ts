import { forwardToHono } from '@/lib/apiProxy';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return forwardToHono(request, '/api/tahun-ajaran/onboard/status');
}
