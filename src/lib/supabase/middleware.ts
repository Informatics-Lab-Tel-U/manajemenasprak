import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasAccess, isPublicPath, ROLE_DEFAULT_REDIRECT, type Role } from '@/config/rbac';
import { AUTH_CONFIG, isMfaRequiredForRole } from '@/config/auth';

export async function updateSession(request: NextRequest) {
  // Prevent client spoofing of the auth header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-auth-user');

  const supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const { pathname } = request.nextUrl;

  // EARLY EXIT: Do not perform any DB/Auth checks for preflight requests
  // or completely public machine-to-machine APIs (like monitoring heartbeat).
  if (
    request.method === 'OPTIONS' ||
    (pathname === '/api/monitoring/heartbeat' && request.method === 'POST') ||
    (pathname === '/api/monitoring/status' && request.method === 'GET') ||
    ((pathname === '/api/praktikan' || pathname.startsWith('/api/praktikan/')) &&
      request.method === 'GET')
  ) {
    return supabaseResponse;
  }

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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not add any logic between createServerClient and getUser().
  // getUser() performs server-side JWT verification (unlike getSession() which only
  // validates locally). getSession() is still called for the access_token needed
  // to forward to the Hono backend.
  // Both run in parallel with maintenance fetch to avoid sequential latency.
  const [
    { data: { user } },
    { data: { session } },
    maintenanceRes,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
    process.env.HONO_BACKEND_URL
      ? fetch(`${process.env.HONO_BACKEND_URL}/api/system/maintenance`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(2000),
        }).catch(() => null)
      : Promise.resolve(null),
  ]);

  const token = session?.access_token;

  let isMaintenanceMode = false;
  if (maintenanceRes?.ok) {
    try {
      const data = await maintenanceRes.json();
      isMaintenanceMode = !!data.active;
    } catch (e) {
      console.error('[Middleware] Failed to parse maintenance response', e);
    }
  }

  // Single pengguna query to Hono backend
  let pengguna: any = null;
  let penggunaError: any = null;

  if (token) {
    try {
      const meRes = await fetch(`${process.env.HONO_BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        pengguna = meData.data?.pengguna;
      } else {
        penggunaError = new Error(`Hono returned ${meRes.status}`);
      }
    } catch (error) {
      penggunaError = error;
    }
  }

  // 1. Redirect away from /maintenance if mode is OFF
  if (!isMaintenanceMode && pathname === '/maintenance') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 2. Redirect to /maintenance if mode is ON (except for ADMINs & login page)
  if (isMaintenanceMode && !pathname.startsWith('/api/auth')) {
    const isAdmin = pengguna?.role === 'ADMIN';

    if (!isAdmin && pathname !== '/maintenance' && pathname !== '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/maintenance';
      return NextResponse.redirect(url);
    }
  }

  // Early exits — non-public API paths
  if (pathname.startsWith('/api/')) {
    if (!user || !pengguna) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return supabaseResponse;
  }

  // Public paths handler
  if (isPublicPath(pathname)) {
    // If an authenticated user visits /login or /maintenance, fall through to status routing below
    if (user && pengguna && (pathname === AUTH_CONFIG.paths.login || pathname === AUTH_CONFIG.paths.maintenance)) {
      // fall through to status routing
    } else {
      return supabaseResponse;
    }
  }

  // All non-public paths require authenticated user & valid profile
  if (!user || !pengguna) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = AUTH_CONFIG.paths.login;
    return NextResponse.redirect(loginUrl);
  }

  if (penggunaError) {
    console.error('[Middleware] Pengguna query failed:', penggunaError);
  }

  const role = pengguna?.role as Role | undefined;
  const status = (pengguna?.status || 'ACTIVE') as 'PENDING' | 'ACTIVE' | 'REJECTED';

  // 1. Handle PENDING approval status
  if (status === 'PENDING') {
    if (pathname !== AUTH_CONFIG.paths.pendingApproval) {
      const pendingUrl = request.nextUrl.clone();
      pendingUrl.pathname = AUTH_CONFIG.paths.pendingApproval;
      return NextResponse.redirect(pendingUrl);
    }
    return supabaseResponse;
  }

  // 2. Handle REJECTED status
  if (status === 'REJECTED') {
    if (pathname !== AUTH_CONFIG.paths.rejected) {
      const rejectedUrl = request.nextUrl.clone();
      rejectedUrl.pathname = AUTH_CONFIG.paths.rejected;
      return NextResponse.redirect(rejectedUrl);
    }
    return supabaseResponse;
  }

  // 3. MFA (TOTP) Security Enforcement for ACTIVE users
  if (status === 'ACTIVE') {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    // A. User has enrolled 2FA and needs to complete AAL2 challenge
    if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
      if (pathname !== AUTH_CONFIG.paths.verify2fa) {
        const verifyUrl = request.nextUrl.clone();
        verifyUrl.pathname = AUTH_CONFIG.paths.verify2fa;
        return NextResponse.redirect(verifyUrl);
      }
      return supabaseResponse;
    }

    // B. Mandated roles MUST enroll in 2FA if not yet enrolled
    if (isMfaRequiredForRole(role) && aalData?.nextLevel !== 'aal2') {
      if (pathname !== AUTH_CONFIG.paths.setup2fa) {
        const setupUrl = request.nextUrl.clone();
        setupUrl.pathname = AUTH_CONFIG.paths.setup2fa;
        return NextResponse.redirect(setupUrl);
      }
      return supabaseResponse;
    }

    // C. User visiting 2FA pages while already fully authenticated (AAL2 or non-enrolled non-mandated)
    if (
      (pathname === AUTH_CONFIG.paths.verify2fa || pathname === AUTH_CONFIG.paths.setup2fa) &&
      aalData?.currentLevel === 'aal2'
    ) {
      const destination = role ? ROLE_DEFAULT_REDIRECT[role] : '/';
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = destination;
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 4. For ACTIVE users visiting pending/rejected pages, redirect to home
  if (status === 'ACTIVE' && (pathname === AUTH_CONFIG.paths.pendingApproval || pathname === AUTH_CONFIG.paths.rejected)) {
    const destination = role ? ROLE_DEFAULT_REDIRECT[role] : '/';
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = destination;
    return NextResponse.redirect(redirectUrl);
  }

  // Handle logged-in active user visiting /login — redirect to their home
  if (pathname === AUTH_CONFIG.paths.login) {
    const destination = role ? ROLE_DEFAULT_REDIRECT[role] : '/';
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = destination;
    return NextResponse.redirect(redirectUrl);
  }

  if (!role || pengguna?.deleted_at) {
    await supabase.auth.signOut();
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = AUTH_CONFIG.paths.login;
    loginUrl.searchParams.set('error', 'no-profile');
    return NextResponse.redirect(loginUrl);
  }

  if (!hasAccess(role, pathname)) {
    const fallback = ROLE_DEFAULT_REDIRECT[role];
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = fallback;
    return NextResponse.redirect(redirectUrl);
  }

  // Inject the user profile into the request headers for Server Components
  const authUser = {
    id: user.id,
    email: user.email ?? '',
    token: token ?? '',
    pengguna,
  };
  requestHeaders.set('x-auth-user', Buffer.from(JSON.stringify(authUser)).toString('base64'));

  const finalResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Preserve any cookies set by Supabase
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value);
  });

  return finalResponse;
}
