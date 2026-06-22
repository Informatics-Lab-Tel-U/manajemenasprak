import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRoleApi } from '@/lib/auth';
import { ALL_ROLES } from '@/config/rbac';
import { apiErrorResponse } from '@/lib/api-error';
import type { CreatePenggunaInput } from '@/types/api';

/**
 * GET /api/admin/users
 * List all users (auth.users joined with pengguna profile).
 * Admin only.
 */
export async function GET() {
  try {
    const guard = await requireRoleApi(['ADMIN']);
    if (!guard.ok) return guard.response;

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
  } catch (err) {
    return apiErrorResponse(err, 'GET /api/admin/users');
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
    const guard = await requireRoleApi(['ADMIN']);
    if (!guard.ok) return guard.response;

    const body: CreatePenggunaInput = await request.json();
    const { email, password, nama_lengkap, role, praktikum_ids } = body;

    if (!email || !password || !nama_lengkap || !role) {
      return NextResponse.json({ ok: false, error: 'Semua field wajib diisi.' }, { status: 400 });
    }

    // Whitelist role to prevent arbitrary role strings (e.g. a bogus 'SUPERADMIN').
    if (!(ALL_ROLES as readonly string[]).includes(role)) {
      return NextResponse.json({ ok: false, error: 'Role tidak valid.' }, { status: 400 });
    }

    // Enforce a minimum password length.
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { ok: false, error: 'Password minimal 8 karakter.' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Format email tidak valid.' }, { status: 400 });
    }

    // Gunakan admin client (Service Role) dari awal sampai akhir untuk Bypass RLS
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

    // 2. INSERT pengguna profile (Bukan UPDATE, karena trigger sudah dimatikan)
    const { error: insertError } = await admin.from('pengguna').insert({
      id: userId,
      nama_lengkap: nama_lengkap,
      role: role,
    });

    // IMPLEMENTASI ROLLBACK: Jika gagal insert profil, hapus auth user agar tidak yatim
    if (insertError) {
      await admin.auth.admin.deleteUser(userId);
      throw new Error(`Gagal membuat profil: ${insertError.message}`);
    }

    // 3. For ASPRAK_KOOR: insert asprak_koordinator records (one per praktikum)
    if (role === 'ASPRAK_KOOR' && praktikum_ids && praktikum_ids.length > 0) {
      const assignmentRows = praktikum_ids.map((pId) => ({
        id_pengguna: userId,
        id_praktikum: pId,
        is_active: true,
      }));

      // Gunakan admin client juga di sini untuk memastikan kelancaran insert server-side
      const { error: assignError } = await admin.from('asprak_koordinator').insert(assignmentRows);

      if (assignError) {
        // Non-fatal — user is created, log the assignment failure
        console.error('Failed to create koor assignments:', assignError.message);
      }
    }

    return NextResponse.json({ ok: true, data: { id: userId } });
  } catch (err) {
    return apiErrorResponse(err, 'POST /api/admin/users');
  }
}
