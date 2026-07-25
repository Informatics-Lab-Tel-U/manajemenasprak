import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.HONO_BACKEND_URL || 'https://manajemenasprak-backend.workers.dev';

/**
 * Standard Next.js Route Handler Proxy function to forward requests to Hono Backend.
 * Supports JSON, FormData, text payloads, and binary/file stream responses.
 */
export async function forwardToHono(request: NextRequest, customPath?: string) {
  try {
    const path = customPath || request.nextUrl.pathname;
    const targetUrl = new URL(`${BACKEND_URL}${path}${request.nextUrl.search}`);

    const headers: Record<string, string> = {};
    const authHeader = request.headers.get('authorization');
    if (authHeader) headers['authorization'] = authHeader;

    const apiKey = request.headers.get('x-praktikan-api-key');
    if (apiKey) headers['x-praktikan-api-key'] = apiKey;

    const contentType = request.headers.get('content-type');

    let body: any = undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (contentType?.includes('multipart/form-data')) {
        body = await request.formData();
      } else {
        body = await request.text();
        if (contentType) {
          headers['content-type'] = contentType;
        }
      }
    }

    const init: RequestInit = {
      method: request.method,
      headers,
      body,
    };

    const res = await fetch(targetUrl.toString(), init);
    const resContentType = res.headers.get('content-type') || '';

    if (resContentType.includes('application/json')) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    }

    // Handle binary / non-JSON responses (Excel exports, downloads, plain text)
    const arrayBuffer = await res.arrayBuffer();
    const resHeaders: Record<string, string> = {};
    if (resContentType) resHeaders['content-type'] = resContentType;
    const disposition = res.headers.get('content-disposition');
    if (disposition) resHeaders['content-disposition'] = disposition;

    return new NextResponse(arrayBuffer, {
      status: res.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || 'Proxy Error' }, { status: 500 });
  }
}
