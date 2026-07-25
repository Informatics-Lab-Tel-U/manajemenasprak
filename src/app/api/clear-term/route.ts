import { forwardToHono } from '@/lib/apiProxy';
import { NextRequest } from 'next/server';

export const fetchCache = 'force-no-store';

export async function POST(request: NextRequest) {
  const body = await request.clone().json().catch(() => ({}));
  const { term } = body;
  return forwardToHono(request, `/api/system/clear-term?term=${encodeURIComponent(term || '')}`);
}
