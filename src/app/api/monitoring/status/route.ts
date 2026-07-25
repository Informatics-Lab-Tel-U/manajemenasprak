import { forwardToHono } from '@/lib/apiProxy';
import { NextRequest } from 'next/server';

export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  return forwardToHono(request, '/monitoring/status');
}
