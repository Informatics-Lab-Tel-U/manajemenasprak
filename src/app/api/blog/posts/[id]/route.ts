import { NextRequest } from 'next/server';
import { forwardToHono } from '@/lib/apiProxy';

export const fetchCache = 'force-no-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return forwardToHono(request, `/api/blog/posts/${id}`);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return forwardToHono(request, `/api/blog/posts/${id}`);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return forwardToHono(request, `/api/blog/posts/${id}`);
}
