import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  hasAccess,
  isPublicPath,
  ROLE_DEFAULT_REDIRECT,
  type Role,
} from '@/config/rbac';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add any logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/auth') && !isPublicPath(pathname)) {
    const { data: maintenanceConfig } = await supabase
      .from('system_config')
      .select('value_bool')
      .eq('key', 'maintenance_mode')
      .single();

    if (maintenanceConfig?.value_bool) {
      if (user) {
        const { data: pengguna } = await supabase
          .from('pengguna')
          .select('role')
          .eq('id', user.id)
          .single();

        if (pengguna?.role !== 'ADMIN') {
          const url = request.nextUrl.clone();
          url.pathname = '/maintenance';
          return NextResponse.redirect(url);
        }
      } else {
        const url = request.nextUrl.clone();
        url.pathname = '/maintenance';
        return NextResponse.redirect(url);
      }
    }
  }

  if (user && pathname === '/login') {
    const { data: pengguna } = await supabase
      .from('pengguna')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = pengguna?.role as Role | undefined;
    const destination = role ? ROLE_DEFAULT_REDIRECT[role] : '/';
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = destination;
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith('/api/')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return supabaseResponse;
  }

  if (isPublicPath(pathname)) return supabaseResponse;

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  const { data: pengguna, error: penggunaError } = await supabase
    .from('pengguna')
    .select('role')
    .eq('id', user.id)
    .single();

  if (penggunaError) {
    console.error('[Middleware] Pengguna query failed:', {
      userId: user.id,
      email: user.email,
      error: penggunaError.message,
      code: penggunaError.code,
      hint: penggunaError.hint,
    });
  }

  const role = pengguna?.role as Role | undefined;

  if (!role) {
    await supabase.auth.signOut();
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('error', 'no-profile');
    return NextResponse.redirect(loginUrl);
  }

  if (!hasAccess(role, pathname)) {
    const fallback = ROLE_DEFAULT_REDIRECT[role];
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = fallback;
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
