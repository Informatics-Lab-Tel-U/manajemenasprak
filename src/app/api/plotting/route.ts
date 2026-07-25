import { NextRequest } from 'next/server';
import { forwardToHono } from '@/lib/apiProxy';

export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  return forwardToHono(request, '/api/plotting');
}

export async function POST(request: NextRequest) {
  return forwardToHono(request, '/api/plotting');
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  return forwardToHono(request, `/api/plotting/${id ?? ''}`);
}
