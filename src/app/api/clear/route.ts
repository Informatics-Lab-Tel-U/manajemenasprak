import { NextResponse } from 'next/server';
import { clearAllData } from '@/services/databaseService';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';

export async function POST() {
  try {
    const guard = await requireRoleApi(['ADMIN']);
    if (!guard.ok) return guard.response;

    await clearAllData();

    return NextResponse.json({ ok: true, message: 'Database cleared' });
  } catch (err) {
    return apiErrorResponse(err, 'POST /api/clear');
  }
}
