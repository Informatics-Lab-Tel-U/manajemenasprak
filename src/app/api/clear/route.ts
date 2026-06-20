import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { clearAllData } from '@/services/databaseService';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';

export async function POST() {
  try {
    const guard = await requireRoleApi(['ADMIN']);
    if (!guard.ok) return guard.response;

    const supabase = await createClient();
    await clearAllData(supabase);

    return NextResponse.json({ message: 'Database cleared' });
  } catch (err) {
    return apiErrorResponse(err, 'POST /api/clear');
  }
}
