import { NextRequest, NextResponse } from 'next/server';
import { requireRoleApi } from '@/lib/auth';
import * as systemService from '@/services/systemService';
import { apiErrorResponse } from '@/lib/api-error';

/**
 * GET /api/system/maintenance
 * Public - anyone can check if maintenance is active
 */
export async function GET() {
  try {
    const isMaintenance = await systemService.getMaintenanceStatus();
    return NextResponse.json({ ok: true, isMaintenance });
  } catch (error: any) {
    return apiErrorResponse(error, 'GET /api/system/maintenance');
  }
}

/**
 * POST /api/system/maintenance
 * Admin only - toggle maintenance mode
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireRoleApi(['ADMIN']);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const { active } = body;

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { ok: false, error: 'Field "active" (boolean) diperlukan' },
        { status: 400 }
      );
    }

    // requireRoleApi guarantees user is AuthUser, extract id from guard.
    const userId = guard.user.id;
    await systemService.setMaintenanceStatus(active, userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err, 'POST /api/system/maintenance');
  }
}
