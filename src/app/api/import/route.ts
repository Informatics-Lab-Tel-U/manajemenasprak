import { forwardToHono } from '@/lib/apiProxy';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  return forwardToHono(request, '/api/import');
}
