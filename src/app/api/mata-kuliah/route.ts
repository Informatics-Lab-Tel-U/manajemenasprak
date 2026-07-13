import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getMataKuliahByTerm,
  createMataKuliah,
  bulkCreateMataKuliah,
  updateMataKuliahColorByPraktikumName,
} from '@/services/mataKuliahService';
import { getOrCreatePraktikum } from '@/services/praktikumService';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    if (!guard.ok) return guard.response;

    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const term = searchParams.get('term');

    const data = await getMataKuliahByTerm(term, supabase);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return apiErrorResponse(err, 'GET /api/mata-kuliah');
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB']);
    if (!guard.ok) return guard.response;

    const supabase = await createClient();
    const body = await request.json();
    const { action, data, term } = body;

    if (action === 'create') {
      let praktikumId = data.id_praktikum;

      if (!praktikumId && data.mk_singkat && term) {
        const praktikum = await getOrCreatePraktikum(data.mk_singkat, term, supabase);
        praktikumId = praktikum.id;
      }

      const payload = {
        id_praktikum: praktikumId,
        nama_lengkap: data.nama_lengkap,
        program_studi: data.program_studi,
        dosen_koor: data.dosen_koor,
        warna: data.warna,
      };

      const result = await createMataKuliah(payload, supabase);

      return NextResponse.json({ ok: true, data: result });
    } else if (action === 'bulk') {
      const finalPayloads: Array<{
        id_praktikum: number;
        nama_lengkap: string;
        program_studi: string;
        dosen_koor: string;
        warna?: string;
      }> = [];
      const errors: string[] = [];

      await Promise.all(
        data.map(async (row: any) => {
          try {
            const praktikum = await getOrCreatePraktikum(row.mk_singkat, term, supabase);

            finalPayloads.push({
              id_praktikum: praktikum.id,
              nama_lengkap: row.nama_lengkap,
              program_studi: row.program_studi,
              dosen_koor: row.dosen_koor,
              warna: row.warna,
            });
          } catch (err: unknown) {
            logger.error(`Failed to prepare ${row.mk_singkat}:`, err);
            errors.push(`Gagal mempersiapkan mata kuliah ${row.mk_singkat}`);
          }
        })
      );

      const result = await bulkCreateMataKuliah(finalPayloads, supabase);

      return NextResponse.json({
        ok: true,
        data: {
          inserted: result.inserted,
          errors: [...errors, ...result.errors],
        },
      });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return apiErrorResponse(err, 'POST /api/mata-kuliah');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB']);
    if (!guard.ok) return guard.response;

    const supabase = await createClient();
    const body = await request.json();
    const { action, data } = body;

    if (action === 'bulk-update-color') {
      if (!Array.isArray(data)) {
        return NextResponse.json({ ok: false, error: 'Invalid data format' }, { status: 400 });
      }

      let updatedCount = 0;
      const errors: string[] = [];

      await Promise.all(
        data.map(async (item: any) => {
          if (!item.id || !item.warna) return;

          const { error } = await supabase
            .from('mata_kuliah')
            .update({ warna: item.warna })
            .eq('id', item.id);

          if (error) {
            logger.error(`Failed to update ${item.id}:`, error);
            errors.push(`Gagal memperbarui warna untuk ID ${item.id}`);
          } else {
            updatedCount++;
          }
        })
      );

      return NextResponse.json({
        ok: true,
        data: { updated: updatedCount, errors },
      });
    }

    if (action === 'bulk-update-global-color') {
      if (!Array.isArray(data)) {
        return NextResponse.json({ ok: false, error: 'Invalid data format' }, { status: 400 });
      }

      let totalUpdated = 0;
      const errors: string[] = [];

      await Promise.all(
        data.map(async (item: any) => {
          if (!item.nama || !item.warna) return;

          try {
            const count = await updateMataKuliahColorByPraktikumName(item.nama, item.warna, supabase);
            totalUpdated += count;
          } catch (err: unknown) {
            logger.error(`Failed to update global color for ${item.nama}:`, err);
            errors.push(`Gagal memperbarui warna global untuk ${item.nama}`);
          }
        })
      );

      return NextResponse.json({
        ok: true,
        data: { updated: totalUpdated, errors },
      });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return apiErrorResponse(err, 'PUT /api/mata-kuliah');
  }
}
