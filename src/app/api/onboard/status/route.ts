import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRoleApi } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authRes = await requireRoleApi(['ADMIN', 'ASLAB']);
    if (!authRes.ok) return authRes.response;

    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');

    if (!term) {
      return NextResponse.json({ error: 'Term parameter is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Check Step 1 (Praktikum & Mata Kuliah)
    const { data: prakData } = await supabase
      .from('praktikum')
      .select('id')
      .eq('tahun_ajaran', term)
      .limit(1);
    
    const step1Done = (prakData && prakData.length > 0) as boolean;

    // 2. Check Step 2 (Jadwal)
    let step2Done = false;
    if (step1Done) {
      const { data: jadwalData } = await supabase
        .from('jadwal')
        .select('id, mata_kuliah!inner(praktikum!inner(tahun_ajaran))')
        .eq('mata_kuliah.praktikum.tahun_ajaran', term)
        .limit(1);
      
      step2Done = (jadwalData && jadwalData.length > 0) as boolean;
    }

    // 3. Check Step 3 (Asprak / Plotting)
    let step3Done = false;
    if (step1Done) {
      const { data: asprakData } = await supabase
        .from('asprak_praktikum')
        .select('id, praktikum!inner(tahun_ajaran)')
        .eq('praktikum.tahun_ajaran', term)
        .limit(1);
        
      step3Done = (asprakData && asprakData.length > 0) as boolean;
    }

    return NextResponse.json({
      term,
      step1_done: step1Done,
      step2_done: step2Done,
      step3_done: step3Done,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
