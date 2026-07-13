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
