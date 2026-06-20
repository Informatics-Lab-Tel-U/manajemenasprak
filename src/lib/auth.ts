import { cache } from 'react';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Role } from '@/config/rbac';
import type { Pengguna } from '@/types/database';

export type AuthUser = {
  id: string;
  email: string;
  pengguna: Pengguna;
};

/**
 * Returns the current authenticated user + their Pengguna profile (with role).
 * Returns null if not authenticated or profile not found.
 * Wrapped with React.cache() so multiple calls in the same request share one DB query.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: pengguna, error: profileError } = await supabase
    .from('pengguna')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !pengguna || pengguna.deleted_at) return null;

  return {
    id: user.id,
    email: user.email ?? '',
    pengguna: pengguna as Pengguna,
  };
});

/**
 * Server-side auth guard.
 * Redirects to /login if the user is not authenticated.
 * Returns the authenticated user if they are logged in.
 */
export async function requireAuth(redirectTo = '/login'): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

/**
 * Server-side role guard.
 * Redirects to `redirectTo` if the user does not have one of the allowed roles.
 * Automatically calls requireAuth first (redirects to /login if unauthenticated).
 *
 * NOTE: This is intended for Server Components / Server Actions only.
 * In Route Handlers (app/api/**) use `requireRoleApi` instead, because
 * `redirect()` throws an internal error there instead of producing a JSON 403.
 */
export async function requireRole(allowedRoles: Role[], redirectTo = '/'): Promise<AuthUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.pengguna.role)) {
    allowedRoles.forEach((role) => {
      console.warn(`Required role: ${role}`);
    });
    redirect(redirectTo);
  }
  return user;
}

/**
 * Result type for the Route Handler auth guard.
 * On failure, return `response` directly from the handler.
 */
export type RoleGuardResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse };

/**
 * Auth + role guard for API Route Handlers (app/api/**).
 *
 * Unlike `requireRole` (which uses `redirect()` and is meant for Server
 * Components), this returns a proper JSON response (401 when unauthenticated,
 * 403 when the role is not allowed). This is the only guard that should be
 * used inside Route Handlers, and it is especially important for endpoints
 * that use the service-role admin client (which bypasses RLS).
 */
export async function requireRoleApi(
  allowedRoles: Role[],
  forbiddenMessage = 'Anda tidak memiliki akses untuk aksi ini'
): Promise<RoleGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!allowedRoles.includes(user.pengguna.role)) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: forbiddenMessage }, { status: 403 }),
    };
  }

  return { ok: true, user };
}
