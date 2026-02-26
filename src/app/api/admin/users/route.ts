import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth';
import type { CreatePenggunaInput } from '@/types/api';

/**
 * GET /api/admin/users
 * List all users (auth.users joined with pengguna profile).
 * Admin only.
 */
export async function GET() {
  try {
    await requireRole(['ADMIN'], '/');

    const admin = createAdminClient();

    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers();
    if (authError) throw authError;

    const { data: pengguna, error: profileError } = await admin.from('pengguna').select('*');
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
 * If role = ASPRAK_KOOR and praktikum_ids provided, insert asprak_koordinator records.
 *
 * asprak_koordinator schema: id_pengguna, id_praktikum, is_active
 * (tahun_ajaran lives in praktikum table — derived via join)
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(['ADMIN'], '/');

    const body: CreatePenggunaInput = await request.json();
    const { email, password, nama_lengkap, role, praktikum_ids } = body;

    if (!email || !password || !nama_lengkap || !role) {
      return NextResponse.json({ ok: false, error: 'Semua field wajib diisi.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Create auth user
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { nama_lengkap },
      email_confirm: true,
    });
    if (createError) throw createError;

    const userId = newUser.user.id;

    // 2. Update pengguna profile (trigger handle_new_user already created the row)
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from('pengguna')
      .update({ nama_lengkap, role })
      .eq('id', userId);
    if (updateError) throw updateError;

    // 3. For ASPRAK_KOOR: insert asprak_koordinator records (one per praktikum)
    if (role === 'ASPRAK_KOOR' && praktikum_ids && praktikum_ids.length > 0) {
      const assignmentRows = praktikum_ids.map((pId) => ({
        id_pengguna: userId,
        id_praktikum: pId,
        is_active: true,
      }));

      const { error: assignError } = await supabase
        .from('asprak_koordinator')
        .insert(assignmentRows);

      if (assignError) {
        // Non-fatal — user is created, log the assignment failure
        console.error('Failed to create koor assignments:', assignError.message);
      }
    }

    return NextResponse.json({ ok: true, data: { id: userId } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
