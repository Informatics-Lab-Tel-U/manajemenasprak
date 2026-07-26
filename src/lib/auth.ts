import { cache } from 'react';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { Role } from '@/config/rbac';
import type { Pengguna } from '@/types/database';

export type AuthUser = {
  id: string;
  email: string;
  token: string;
  pengguna: Pengguna;
};

/**
 * Returns the current authenticated user + their Pengguna profile (with role).
 * Returns null if not authenticated or profile not found.
 * Wrapped with React.cache() so multiple calls in the same request share one DB query.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  console.log('[DEBUG auth.ts] getCurrentUser called');
  try {
    const headersList = await headers();
    const authUserHeader = headersList.get('x-auth-user');
    
    if (authUserHeader) {
      const decodedStr = Buffer.from(authUserHeader, 'base64').toString('utf-8');
      const authUser = JSON.parse(decodedStr) as AuthUser;
      if (authUser?.id && authUser?.pengguna) {
        console.log('[DEBUG auth.ts] User retrieved from x-auth-user header:', authUser.id, authUser.pengguna.role);
        return authUser;
      }
    }
  } catch (error) {
    logger.warn('Failed to parse x-auth-user header, falling back to DB query', { error });
  }

  const supabase = await createClient();

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session?.user) {
    console.log('[DEBUG auth.ts] No session or authError:', authError?.message);
    return null;
  }

  console.log('[DEBUG auth.ts] Session found for user:', session.user.id, 'Has access_token:', !!session.access_token);

  try {
    const meRes = await fetch(`${process.env.HONO_BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!meRes.ok) {
      console.log('[DEBUG auth.ts] /api/auth/me returned not OK:', meRes.status);
      return null;
    }

    const meData = await meRes.json();
    const pengguna = meData.data?.pengguna;

    if (!pengguna || pengguna.deleted_at) {
      console.log('[DEBUG auth.ts] No pengguna profile or deleted');
      return null;
    }

    console.log('[DEBUG auth.ts] Successfully authenticated user:', session.user.id, 'Role:', pengguna.role);

    return {
      id: session.user.id,
      email: session.user.email ?? '',
      token: session.access_token,
      pengguna: pengguna as Pengguna,
    };
  } catch (error) {
    logger.error('Failed to fetch profile from Hono in auth.ts', { error });
    return null;
  }
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
    logger.warn('Access denied', { userRole: user.pengguna.role, allowedRoles });
    redirect(redirectTo);
  }
  return user;
}

/**
 * Result type for the Route Handler auth guard.
 * On failure, return `response` directly from the handler.
 */
export type RoleGuardResult = { ok: true; user: AuthUser } | { ok: false; response: NextResponse };

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
