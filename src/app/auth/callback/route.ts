import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Allowed official Telkom University email domains
const ALLOWED_EMAIL_DOMAINS = [
  'student.telkomuniversity.ac.id',
  'telkomuniversity.ac.id',
];

function isTelkomUniversityEmail(email?: string): boolean {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.includes(domain);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no-code`);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      console.error('[OAuth Callback] exchangeCodeForSession failed:', error);
      return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
    }

    const user = data.user;
    const email = user.email?.toLowerCase() || '';

    // 🛡️ SECURITY LAYER: Enforce Telkom University domain
    if (!isTelkomUniversityEmail(email)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${origin}/login?error=invalid-domain`
      );
    }

    // Ensure user profile exists in 'pengguna' table
    try {
      const admin = createAdminClient();
      const { data: existingProfile } = await admin
        .from('pengguna')
        .select('id, status, role')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        const rawName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Civitas Telkom University';

        await admin.from('pengguna').insert({
          id: user.id,
          nama_lengkap: rawName,
          role: 'ASLAB', // placeholder role until approved by admin
          status: 'PENDING',
        });
      }
    } catch (err) {
      console.error('[OAuth Callback] Failed to ensure pengguna row:', err);
    }

    // Check forwarded host for correct redirection behind proxies/load balancers
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';

    const isValidRelativeUrl =
      next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\');
    const targetRedirect = isValidRelativeUrl ? next : '/';

    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${targetRedirect}`);
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${targetRedirect}`);
    } else {
      return NextResponse.redirect(`${origin}${targetRedirect}`);
    }
  } catch (err) {
    console.error('[OAuth Callback] Unexpected error:', err);
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
  }
}
