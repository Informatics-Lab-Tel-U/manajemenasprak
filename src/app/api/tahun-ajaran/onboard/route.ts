import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';

export async function POST(req: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN', 'ASLAB']);
    if (!guard.ok) return guard.response;

    const supabase = await createClient();
    const body = await req.json();
    const { praktikumList, mataKuliahList } = body;

    if (!praktikumList || !Array.isArray(praktikumList)) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }

    if (praktikumList.length === 0) {
      return NextResponse.json({ ok: true, message: 'Nothing to save' });
    }

    // 1. Upsert Praktikum to get all real UUIDs
    const dbPraktikum = praktikumList.map(p => ({
      nama: p.nama,
      tahun_ajaran: p.tahun_ajaran
    }));

    // Perform upsert (using unique constraint on nama, tahun_ajaran if it exists, otherwise relying on Supabase matching)
    // To be perfectly robust without knowing constraints, we can query existing ones first.
    const terms = Array.from(new Set(praktikumList.map(p => p.tahun_ajaran)));
    
    // Fetch existing
    const { data: existingPrak, error: errFetch } = await supabase
      .from('praktikum')
      .select('id, nama, tahun_ajaran')
      .in('tahun_ajaran', terms as string[]);
      
    if (errFetch) throw errFetch;
    
    const existingMap = new Map();
    (existingPrak || []).forEach(p => existingMap.set(p.nama + '_' + p.tahun_ajaran, p.id));
    
    const toInsert = dbPraktikum.filter(p => !existingMap.has(p.nama + '_' + p.tahun_ajaran));
    
    let allRealPraktikum = [...(existingPrak || [])];
    
    if (toInsert.length > 0) {
      const { data: inserted, error: errInsert } = await supabase
        .from('praktikum')
        .insert(toInsert)
        .select('id, nama, tahun_ajaran');
        
      if (errInsert) throw errInsert;
      allRealPraktikum = [...allRealPraktikum, ...(inserted || [])];
    }
    
    // Re-build map with all real UUIDs
    const realMap = new Map();
    allRealPraktikum.forEach(p => realMap.set(p.nama + '_' + p.tahun_ajaran, p.id));

    // 2. Prepare Mata Kuliah payload
    if (mataKuliahList && mataKuliahList.length > 0) {
      const dbMataKuliah = mataKuliahList.map((mk: any) => {
        const tempPrak = praktikumList.find(p => p.tempId === mk.id_praktikum);
        if (!tempPrak) throw new Error('Draf Praktikum tidak ditemukan untuk MK ' + mk.nama_lengkap);
        
        const realId = realMap.get(tempPrak.nama + '_' + tempPrak.tahun_ajaran);
        if (!realId) throw new Error('UUID asli tidak ditemukan untuk ' + tempPrak.nama);
        
        return {
          id_praktikum: realId,
          nama_lengkap: mk.nama_lengkap,
          program_studi: mk.program_studi,
          dosen_koor: mk.dosen_koor || null
        };
      });
      
      const { error: errMk } = await supabase
        .from('mata_kuliah')
        .insert(dbMataKuliah);
        
      if (errMk) throw errMk;
    }

    return NextResponse.json({ ok: true, message: 'Berhasil menyimpan semua data' });
  } catch (err: any) {
    return apiErrorResponse(err, 'POST /api/tahun-ajaran/onboard');
  }
}
