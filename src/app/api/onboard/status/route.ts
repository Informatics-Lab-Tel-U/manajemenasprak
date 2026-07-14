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
      .eq('tahun_ajaran', term);
    
    const prakIds = prakData?.map((p: any) => p.id) || [];
    const step1Done = prakIds.length > 0;

    // 2. Check Step 2 (Jadwal)
    let step2Done = false;
    if (step1Done) {
      const { data: mkData } = await supabase
        .from('mata_kuliah')
        .select('id')
        .in('id_praktikum', prakIds);
      
      const mkIds = mkData?.map((mk: any) => mk.id) || [];
      if (mkIds.length > 0) {
        const { count: jadwalCount } = await supabase
          .from('jadwal')
          .select('*', { count: 'exact', head: true })
          .in('id_mk', mkIds);
        
        step2Done = (jadwalCount || 0) > 0;
      }
    }

    // 3. Check Step 3 (Asprak / Plotting)
    let step3Done = false;
    if (step1Done) {
      const { count: asprakCount } = await supabase
        .from('asprak_praktikum')
        .select('*', { count: 'exact', head: true })
        .in('id_praktikum', prakIds);
        
      step3Done = (asprakCount || 0) > 0;
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
