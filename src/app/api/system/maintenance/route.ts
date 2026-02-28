import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import * as systemService from '@/services/systemService';
import { logger } from '@/lib/logger';

/**
 * GET /api/system/maintenance
 * Public - anyone can check if maintenance is active
 */
export async function GET() {
  try {
    const isMaintenance = await systemService.getMaintenanceStatus();
    return NextResponse.json({ ok: true, isMaintenance });
  } catch (error: any) {
    logger.error('API Error in /api/system/maintenance GET:', error);
    return NextResponse.json(
      { ok: false, error: 'Gagal mengecek status maintenance' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/system/maintenance
 * Admin only - toggle maintenance mode
 */
export async function POST(request: NextRequest) {
  try {
    // Only Admin can toggle maintenance
    const user = await requireRole(['ADMIN']);
    
    const body = await request.json();
    const { active } = body;

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { ok: false, error: 'Field "active" (boolean) diperlukan' },
        { status: 400 }
      );
    }

    await systemService.setMaintenanceStatus(active, user.id);

    const { createAuditLog } = await import('@/services/server/auditLogService');
    await createAuditLog('System', 'maintenance_mode', active ? 'ENABLE_MAINTENANCE' : 'DISABLE_MAINTENANCE');

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    // Check if it's a redirect from requireRole
    if (error.digest?.startsWith('NEXT_REDIRECT')) throw error;

    logger.error('API Error in /api/system/maintenance POST:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Gagal mengubah status maintenance' },
      { status: 500 }
    );
  }
}
