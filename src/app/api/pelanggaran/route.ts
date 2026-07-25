import { NextRequest } from 'next/server';
import { forwardToHono } from '@/lib/apiProxy';

export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  return forwardToHono(request, '/api/pelanggaran');
}

export async function POST(request: NextRequest) {
  return forwardToHono(request, '/api/pelanggaran');
}

export async function DELETE(request: NextRequest) {
  return forwardToHono(request, '/api/pelanggaran');
}
