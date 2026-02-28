import { redirect } from 'next/navigation';
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
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
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

  if (profileError || !pengguna) return null;

  return {
    id: user.id,
    email: user.email ?? '',
    pengguna: pengguna as Pengguna,
  };
}

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
