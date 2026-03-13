import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasAccess, isPublicPath, ROLE_DEFAULT_REDIRECT, type Role } from '@/config/rbac';

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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add any logic between createServerClient and getUser().
  // getUser + system_config are independent — run them in parallel.
  const [
    {
      data: { user },
    },
    { data: maintenanceConfig },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('system_config').select('value_bool').eq('key', 'maintenance_mode').single(),
  ]);

  const { pathname } = request.nextUrl;
  const isMaintenanceMode = !!maintenanceConfig?.value_bool;

  // 1. Redirect away from /maintenance if mode is OFF
  if (!isMaintenanceMode && pathname === '/maintenance') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 2. Redirect to /maintenance if mode is ON (except for ADMINs & login page)
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

  // Early exits — no pengguna query needed
  if (pathname.startsWith('/api/')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return supabaseResponse;
  }

  if (isPublicPath(pathname)) {
    // Allow logged-in users visiting /login to fall through and get redirected
    if (user && pathname === '/login') {
      // fall through
    } else {
      return supabaseResponse;
    }
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  // Single pengguna query — reused for both login-redirect and role-check (was 2 separate queries)
  const { data: pengguna, error: penggunaError } = await supabase
    .from('pengguna')
    .select('role, deleted_at')
    .eq('id', user.id)
    .maybeSingle();

  if (penggunaError) {
    console.error('[Middleware] Pengguna query failed:', penggunaError);
  }

  const role = pengguna?.role as Role | undefined;

  // Handle logged-in user visiting /login — redirect to their home
  if (pathname === '/login') {
    const destination = role ? ROLE_DEFAULT_REDIRECT[role] : '/';
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = destination;
    return NextResponse.redirect(redirectUrl);
  }

  if (!role || pengguna?.deleted_at) {
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
