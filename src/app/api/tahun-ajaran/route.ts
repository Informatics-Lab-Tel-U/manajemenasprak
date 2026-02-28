import { NextResponse } from 'next/server';
import { getAvailableTahunAjaran } from '@/services/server/tahunAjaranService';
import { requireRole } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    // Only ADMIN and ASLAB can access this
    await requireRole(['ADMIN', 'ASLAB']);
    
    const data = await getAvailableTahunAjaran();
    
    return NextResponse.json({
      ok: true,
      data
    });
  } catch (e: any) {
    logger.error('API /api/tahun-ajaran failed:', e);
    return NextResponse.json(
      { ok: false, error: e.message || 'Failed to fetch academic years' },
      { status: e.status || 500 }
    );
  }
}

