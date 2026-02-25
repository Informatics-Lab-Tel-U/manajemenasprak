import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth';
import type { UpdatePenggunaInput } from '@/types/api';

/**
 * PATCH /api/admin/users/[id]
 * Update a user's role or nama_lengkap.
 * Admin only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['ADMIN'], '/');

    const { id } = await params;
    const body: UpdatePenggunaInput = await request.json();

    const admin = createAdminClient();

    const { error } = await admin
      .from('pengguna')
      .update(body)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user from the system (auth + Pengguna via CASCADE).
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

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
