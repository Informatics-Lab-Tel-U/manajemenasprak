import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth';
import type { CreatePenggunaInput, UpdatePenggunaInput } from '@/types/api';

/**
 * GET /api/admin/users
 * List all users (auth.users joined with Pengguna profile).
 * Admin only.
 */
export async function GET() {
  try {
    await requireRole(['ADMIN'], '/');

    const admin = createAdminClient();

    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers();
    if (authError) throw authError;

    const { data: pengguna, error: profileError } = await admin
      .from('pengguna')
      .select('*');
    if (profileError) throw profileError;

    const profileMap = new Map(pengguna.map((p: any) => [p.id, p]));

    const users = authUsers.users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      ...(profileMap.get(u.id) ?? {}),
    }));

    return NextResponse.json({ ok: true, data: users });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Create a new user with a specific role.
 * Admin only.
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(['ADMIN'], '/');

    const body: CreatePenggunaInput = await request.json();
    const { email, password, nama_lengkap, role } = body;

    if (!email || !password || !nama_lengkap || !role) {
      return NextResponse.json(
        { ok: false, error: 'Semua field wajib diisi.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Create auth user (email_confirm disabled in Supabase settings)
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { nama_lengkap },
      email_confirm: true, // skip email verification flow entirely
    });

    if (createError) throw createError;

    // The trigger handle_new_user auto-creates a Pengguna row with default role ASPRAK_KOOR.
    // Override the role with the one specified.
    const { error: updateError } = await admin
      .from('pengguna')
      .update({ nama_lengkap, role })
      .eq('id', newUser.user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, data: { id: newUser.user.id } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
