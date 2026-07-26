import { forwardToHono } from '@/lib/apiProxy';
import { NextRequest } from 'next/server';

export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const term = url.searchParams.get('term') || '';
  return forwardToHono(request, `/api/tahun-ajaran/onboard/status?term=${encodeURIComponent(term)}`);
}
