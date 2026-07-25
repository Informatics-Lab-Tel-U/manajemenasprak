import { forwardToHono } from '@/lib/apiProxy';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return forwardToHono(request, `/api/praktikum/${id}/asprak`);
}
