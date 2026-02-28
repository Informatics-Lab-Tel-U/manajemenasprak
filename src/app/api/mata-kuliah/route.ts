import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMataKuliahByTerm, createMataKuliah, bulkCreateMataKuliah } from '@/services/mataKuliahService';
import { getOrCreatePraktikum } from '@/services/praktikumService';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['ADMIN', 'ASLAB', 'ASPRAK_KOOR']);
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const term = searchParams.get('term');

    const data = await getMataKuliahByTerm(term, supabase);
    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['ADMIN', 'ASLAB']);
    const supabase = await createClient();
    const body = await request.json();
    const { action, data, term } = body;

    if (action === 'create') {
        // Handle single creation logic
        // If praktikum doesn't exist, create it on the fly?
        // The frontend should have handled fetching the praktikum ID or requesting creation
        
        // Expect data to have id_praktikum usually, but let's see if we need to create praktikum first
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

        if (result) {
            const { createAuditLog } = await import('@/services/server/auditLogService');
            await createAuditLog('Mata_Kuliah', result.id, 'CREATE', payload);
        }

        return NextResponse.json({ ok: true, data: result });
        
    } else if (action === 'bulk') {
        // Bulk import logic
        // data is array of { mk_singkat, nama_lengkap, program_studi, dosen_koor }
        // We need to resolve mk_singkat to id_praktikum for each
        // Optimally, fetch all praktikum for the term once
        
        // This logic is better placed in backend to avoid multiple round trips from frontend
        // But for transparency and reusability, let's process here.
        
        // 1. Get all Praktikum names for the term to cache IDs
        // Actually getOrCreatePraktikum handles existence check but calling it in loop is okay for moderate size
        
        const finalPayloads = [];
        const errors = [];

        for (const row of data) {
            try {
                // Ensure Praktikum exists
                // Row has: mk_singkat, nama_lengkap, program_studi, dosen_koor
                const praktikum = await getOrCreatePraktikum(row.mk_singkat, term, supabase);
                
                finalPayloads.push({
                    id_praktikum: praktikum.id,
                    nama_lengkap: row.nama_lengkap,
                    program_studi: row.program_studi,
                    dosen_koor: row.dosen_koor,
                    warna: row.warna,
                });
            } catch (err: any) {
                errors.push(`Failed to prepare ${row.mk_singkat}: ${err.message}`);
            }
        }
        
        const result = await bulkCreateMataKuliah(finalPayloads, supabase);

        const { createAuditLog } = await import('@/services/server/auditLogService');
        await createAuditLog('Mata_Kuliah', 'BULK', 'IMPORT', { count: result.inserted });

        return NextResponse.json({
            ok: true,
            data: {
              inserted: result.inserted,
              errors: [...errors, ...result.errors],
            },
        });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole(['ADMIN', 'ASLAB']);
    const supabase = await createClient();
    const body = await request.json();
    const { action, data } = body;

    if (action === 'bulk-update-color') {
      // Validate data is array of { id, warna }
      if (!Array.isArray(data)) {
        return NextResponse.json({ ok: false, error: 'Invalid data format' }, { status: 400 });
      }

      // Supabase has no direct bulk update, so we update sequentially
      let updatedCount = 0;
      const errors: string[] = [];

      for (const item of data) {
        if (!item.id || !item.warna) continue;
        
        const { error } = await supabase
          .from('mata_kuliah')
          .update({ warna: item.warna })
          .eq('id', item.id);
          
        if (error) {
          errors.push(`Failed to update ${item.id}: ${error.message}`);
        } else {
          updatedCount++;
        }
      }

      return NextResponse.json({
        ok: true,
        data: { updated: updatedCount, errors },
      });
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
