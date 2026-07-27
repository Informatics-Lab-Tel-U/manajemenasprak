import { forwardToHono } from '@/lib/apiProxy';
import { NextRequest } from 'next/server';

export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const term = url.searchParams.get('term') || '';
  const timeParam = url.searchParams.get('_t') || '';
  console.log(`[ONBOARD-DEBUG][NextAPI] GET /api/onboard/status received -> term: ${term}, _t: ${timeParam}`);
  
  const response = await forwardToHono(request, '/api/tahun-ajaran/onboard/status');
  console.log(`[ONBOARD-DEBUG][NextAPI] Response forwarded from Hono -> status: ${response.status}`);
  return response;
}
