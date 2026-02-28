import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await requireRole(['ADMIN', 'ASLAB']);
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const term = searchParams.get('term');

    logger.info(`Export Request received for term: ${term}`);

    if (!term) {
      return NextResponse.json({ error: 'Term parameter is required' }, { status: 400 });
    }

    // 1. Fetch Praktikum
    const { data: praktikum, error: pError } = await supabase
      .from('praktikum')
      .select('*')
      .eq('tahun_ajaran', term);
    
    if (pError) throw pError;
    
    logger.info(`Found ${praktikum?.length || 0} praktikum records for ${term}`);

    if (!praktikum || praktikum.length === 0) {
      return NextResponse.json({
        ok: true,
        data: {
          praktikum: [],
          mata_kuliah: [],
          asprak: [],
          jadwal: [],
          asprak_praktikum: []
        },
        message: `No data found for term ${term}`
      });
    }

    const pIds = praktikum.map(p => p.id);

    // 2. Fetch Mata Kuliah
    const { data: mk, error: mkError } = await supabase
      .from('mata_kuliah')
      .select('*, praktikum:praktikum(nama)')
      .in('id_praktikum', pIds);
    
    if (mkError) throw mkError;
    const mkIds = mk.map(m => m.id);
    logger.info(`Found ${mk?.length || 0} mata_kuliah records`);

    // 3. Fetch Asprak (those linked to this term's praktikum)
    const { data: pivot, error: pivotError } = await supabase
      .from('asprak_praktikum')
      .select('*, asprak:asprak(*), praktikum:praktikum(nama)')
      .in('id_praktikum', pIds);
    
    if (pivotError) throw pivotError;
    logger.info(`Found ${pivot?.length || 0} pivot records`);

    // Extract unique asprak
    const asprakMap = new Map();
    pivot.forEach((item: any) => {
      if (item.asprak) {
        asprakMap.set(item.asprak.id, item.asprak);
      }
    });
    const asprak = Array.from(asprakMap.values());
    logger.info(`Extracted ${asprak.length} unique asprak`);

    // 4. Fetch Jadwal
    const { data: jadwal, error: jError } = await supabase
      .from('jadwal')
      .select('*, mata_kuliah:mata_kuliah(id_praktikum, praktikum:praktikum(nama))')
      .in('id_mk', mkIds);
    
    if (jError) throw jError;
    logger.info(`Found ${jadwal?.length || 0} jadwal records`);

    // Formatting for Excel
    const formattedPraktikum = praktikum.map(p => ({
      nama_singkat: p.nama,
      tahun_ajaran: p.tahun_ajaran
    }));

    const formattedMk = mk.map(m => ({
      mk_singkat: (m as any).praktikum?.nama || '',
      program_studi: m.program_studi,
      nama_lengkap: m.nama_lengkap,
      dosen_koor: m.dosen_koor
    }));

    const formattedAsprak = asprak.map(a => ({
      nim: a.nim,
      nama_lengkap: a.nama_lengkap,
      kode: a.kode,
      angkatan: a.angkatan
    }));

    const formattedJadwal = jadwal.map(j => ({
      kelas: j.kelas,
      nama_singkat: (j as any).mata_kuliah?.praktikum?.nama || '',
      hari: j.hari,
      sesi: j.sesi,
      jam: j.jam,
      ruangan: j.ruangan,
      total_asprak: j.total_asprak,
      dosen: j.dosen
    }));

    const formattedPivot = pivot.map(p => ({
      kode_asprak: (p as any).asprak?.kode || '',
      mk_singkat: (p as any).praktikum?.nama || ''
    }));

    return NextResponse.json({
      ok: true,
      data: {
        praktikum: formattedPraktikum,
        mata_kuliah: formattedMk,
        asprak: formattedAsprak,
        jadwal: formattedJadwal,
        asprak_praktikum: formattedPivot
      }
    });

  } catch (e: any) {
    logger.error('Export failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

