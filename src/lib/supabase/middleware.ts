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

  // 1. Check Maintenance Mode
  const { data: maintenanceConfig } = await supabase
    .from('system_config')
    .select('value_bool')
    .eq('key', 'maintenance_mode')
    .single();
  const isMaintenanceMode = !!maintenanceConfig?.value_bool;

  // 2. Redirect away from /maintenance if mode is OFF
  if (!isMaintenanceMode && pathname === '/maintenance') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 3. Redirect to /maintenance if mode is ON (except for ADMINs & login page)
  if (isMaintenanceMode && !pathname.startsWith('/api/auth')) {
    let isAdmin = false;
    if (user) {
      const { data: pengguna } = await supabase
        .from('pengguna')
        .select('role')
        .eq('id', user.id)
        .single();
      isAdmin = pengguna?.role === 'ADMIN';
    }

    if (!isAdmin && pathname !== '/maintenance' && pathname !== '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/maintenance';
      return NextResponse.redirect(url);
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
