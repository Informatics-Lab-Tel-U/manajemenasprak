import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearAllData } from '@/services/databaseService';
import { requireRole } from '@/lib/auth';

export async function POST() {
  try {
    await requireRole(['ADMIN']);
    const supabase = await createClient();
    await clearAllData(supabase);

    return NextResponse.json({ message: 'Database cleared' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
