'use server';

import { createClient } from '@/lib/supabase/server';
import { AUTH_CONFIG, isMfaRequiredForRole } from '@/config/auth';
import type { Role } from '@/config/rbac';

export async function logout() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  const { error } = await supabase.auth.signOut({ scope: 'global' });
  if (error) {
    throw error;
  }
}

export async function login(email: string, password: string, turnstileToken: string | null) {
  const turnstileSecret = process.env.TURNSTILE_SECRET;

  if (turnstileSecret) {
    if (!turnstileToken) {
      return { error: 'Verifikasi Turnstile diperlukan.' };
    }

    try {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: turnstileToken,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return { error: 'Verifikasi Turnstile gagal. Silakan coba lagi.' };
      }
    } catch (err) {
      console.error('Turnstile siteverify error:', err);
      return { error: 'Gagal melakukan verifikasi keamananan.' };
    }
  }

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  let redirectTo = '/';

  if (authData.user) {
    try {
      // Check MFA Assurance Level
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      // Check Pengguna Role via Hono Backend API
      const meRes = await fetch(`${process.env.HONO_BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authData.session?.access_token}` },
        cache: 'no-store',
      });

      let role: Role | undefined;
      if (meRes.ok) {
        const meData = await meRes.json();
        role = meData.data?.pengguna?.role;
      }

      if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
        redirectTo = AUTH_CONFIG.paths.verify2fa;
      } else if (isMfaRequiredForRole(role) && aalData?.nextLevel !== 'aal2') {
        redirectTo = AUTH_CONFIG.paths.setup2fa;
      }
    } catch (err) {
      console.error('[Login Action] Error checking MFA state:', err);
    }
  }

  return { success: true, redirectTo };
}
