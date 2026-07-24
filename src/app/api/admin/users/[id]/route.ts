import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRoleApi } from '@/lib/auth';
import { ALL_ROLES } from '@/config/rbac';
import { apiErrorResponse } from '@/lib/api-error';
import type { UpdatePenggunaInput } from '@/types/api';

/**
 * PATCH /api/admin/users/[id]
 * Update a user's profile (name, role).
 * If role = ASPRAK_KOOR and praktikum_ids provided, sync asprak_koordinator records.
 *
 * asprak_koordinator schema: id_pengguna, id_praktikum, is_active
 * UNIQUE constraint: (id_pengguna, id_praktikum)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireRoleApi(['ADMIN']);
    if (!guard.ok) return guard.response;

    const { id: userId } = await params;
    const body: UpdatePenggunaInput = await request.json();
    const { nama_lengkap, role, praktikum_ids, password } = body;

    // Whitelist role when provided.
    if (role && !(ALL_ROLES as readonly string[]).includes(role)) {
      return NextResponse.json({ ok: false, error: 'Role tidak valid.' }, { status: 400 });
    }

    // Enforce minimum password length when provided.
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 8) {
        return NextResponse.json(
          { ok: false, error: 'Password minimal 8 karakter.' },
          { status: 400 }
        );
      }
    }

    const admin = createAdminClient();
    const supabase = await createClient();

    // 1. Update auth password if provided (Admin only, direct update)
    if (password) {
      const { error: authError } = await admin.auth.admin.updateUserById(userId, {
        password: password,
      });
      if (authError) throw authError;
    }

    // 2. Update basic profile
    const updateData: Record<string, any> = {};
    if (nama_lengkap) updateData.nama_lengkap = nama_lengkap;
    if (role) updateData.role = role;

    if (Object.keys(updateData).length > 0) {
      const { error } = await admin.from('pengguna').update(updateData).eq('id', userId);
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

        const { error: insertError } = await admin.from('asprak_koordinator').insert(rows);
        if (insertError) throw insertError;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err, 'PATCH /api/admin/users/[id]');
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
    const guard = await requireRoleApi(['ADMIN']);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const admin = createAdminClient();

    const { error } = await admin
      .from('pengguna')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err, 'DELETE /api/admin/users/[id]');
  }
}
