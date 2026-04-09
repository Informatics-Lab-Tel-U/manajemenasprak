import { NextResponse } from 'next/server';
import { getRekapJagaAggregated } from '@/services/jagaService';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');

    if (!term) {
      return NextResponse.json({ error: 'Term parameter is required' }, { status: 400 });
    }

    const data = await getRekapJagaAggregated(term);
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
