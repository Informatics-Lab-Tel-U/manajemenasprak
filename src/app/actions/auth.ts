'use server';

import { createClient } from '@/lib/supabase/server';

export async function logout() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  const { error } = await supabase.auth.signOut();
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
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: turnstileToken
      ? {
          captchaToken: turnstileToken,
        }
      : undefined,
  });

  if (error) {
    return { error: error.message };
  }
  return { success: true };
}
