import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth';
import type { UpdatePenggunaInput } from '@/types/api';

/**
 * PATCH /api/admin/users/[id]
 * Update a user's profile (name, role).
 * If role = ASPRAK_KOOR and praktikum_ids provided, sync asprak_koordinator records.
 *
 * asprak_koordinator schema: id_pengguna, id_praktikum, is_active
 * UNIQUE constraint: (id_pengguna, id_praktikum)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['ADMIN'], '/');

    const { id: userId } = await params;
    const body: UpdatePenggunaInput = await request.json();
    const { nama_lengkap, role, praktikum_ids, password } = body;

    const admin = createAdminClient();
    const supabase = await createClient();

    // 1. Update auth password if provided (Admin only, direct update)
    if (password) {
      const { error: authError } = await admin.auth.admin.updateUserById(userId, {
        password: password,
      });
      if (authError) throw authError;

      const { createAuditLog } = await import('@/services/server/auditLogService');
      await createAuditLog('User', userId, 'UPDATE_PASSWORD');
    }

    // 2. Update basic profile
    const updateData: Record<string, any> = {};
    if (nama_lengkap) updateData.nama_lengkap = nama_lengkap;
    if (role) updateData.role = role;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('pengguna')
        .update(updateData)
        .eq('id', userId);
      if (error) throw error;
    }

    // 2. Sync ASPRAK_KOOR assignments if provided
    //    Strategy: delete all existing → insert new ones
    //    Uses only id_pengguna + id_praktikum (no id_mata_kuliah, no tahun_ajaran)
    if (role === 'ASPRAK_KOOR' && praktikum_ids) {
      // Delete all existing assignments for this user
      const { error: deleteError } = await admin
        .from('asprak_koordinator')
        .delete()
        .eq('id_pengguna', userId);
      if (deleteError) throw deleteError;

      // Insert new assignments
      if (praktikum_ids.length > 0) {
        const rows = praktikum_ids.map((pId) => ({
          id_pengguna: userId,
          id_praktikum: pId,
          is_active: true,
        }));

        const { error: insertError } = await admin
          .from('asprak_koordinator')
          .insert(rows);
        if (insertError) throw insertError;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user from auth + cascade to pengguna.
 * Admin only.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['ADMIN'], '/');

    const { id } = await params;
    const admin = createAdminClient();

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;

    const { createAuditLog } = await import('@/services/server/auditLogService');
    await createAuditLog('User', id, 'DELETE');

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
