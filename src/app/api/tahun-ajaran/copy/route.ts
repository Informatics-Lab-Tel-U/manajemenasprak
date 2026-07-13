import { NextResponse } from 'next/server';
import { requireRoleApi } from '@/lib/auth';
import { copyTahunAjaran } from '@/services/tahunAjaranCopyService';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    // RBAC: Only Admin or Aslab can initiate copy
    const auth = await requireRoleApi(['ADMIN', 'ASLAB']);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { sourceTerm, targetTerm, options } = body;

    if (!sourceTerm || !targetTerm) {
      return NextResponse.json(
        { error: 'sourceTerm dan targetTerm harus diisi' },
        { status: 400 }
      );
    }

    const defaultOptions = {
      copyPraktikum: true,
      copyMataKuliah: true,
      copyAsprakAssignments: true,
    };

    const finalOptions = { ...defaultOptions, ...options };

    const result = await copyTahunAjaran(sourceTerm, targetTerm, finalOptions);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, details: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: result.message, data: result.data },
      { status: 200 }
    );

  } catch (error: any) {
    logger.error('Error in POST /api/tahun-ajaran/copy:', error);
    
    // Auth error handling
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat menyalin data.' },
      { status: 500 }
    );
  }
}
