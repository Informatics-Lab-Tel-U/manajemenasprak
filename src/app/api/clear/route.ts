import { forwardToHono } from '@/lib/apiProxy';
import { NextRequest } from 'next/server';

export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  return forwardToHono(request, '/api/system/clear-all');
}
