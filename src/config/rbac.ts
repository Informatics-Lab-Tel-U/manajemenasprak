/**
 * Role-Based Access Control (RBAC) configuration.
 *
 * This is the single source of truth for all role permissions.
 * To grant/revoke access: edit the `ROLE_PERMISSIONS` map below.
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  ASLAB: 'ASLAB',
  ASPRAK_KOOR: 'ASPRAK_KOOR',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = [ROLES.ADMIN, ROLES.ASLAB, ROLES.ASPRAK_KOOR];

/**
 * Defines which routes each role can access.
 * Use exact path prefixes; the middleware uses startsWith() matching.
 *
 * Order matters: more specific paths should come before less specific ones.
 */
export const ROLE_ALLOWED_PATHS: Record<Role, string[]> = {
  ADMIN: [
    '/',
    '/praktikum',
    '/mata-kuliah',
    '/asprak',
    '/plotting',
    '/jadwal',
    '/pelanggaran',
    '/manajemen-akun',
    '/audit-logs',
    '/panduan',
    '/pengaturan',
    '/database',
  ],
  ASLAB: [
    '/',
    '/praktikum',
    '/mata-kuliah',
    '/asprak',
    '/plotting',
    '/jadwal',
    '/pelanggaran',
    '/panduan',
    '/database',
    '/audit-logs',
  ],
  ASPRAK_KOOR: ['/pelanggaran', '/panduan'],
};

/**
 * Paths that are always public (no auth required).
 */
export const PUBLIC_PATHS = ['/login', '/auth', '/maintenance'];

/**
 * The default redirect destination when a role tries to access a forbidden path.
 */
export const ROLE_DEFAULT_REDIRECT: Record<Role, string> = {
  ADMIN: '/',
  ASLAB: '/',
  ASPRAK_KOOR: '/pelanggaran',
};

/**
 * Returns true if the given role is allowed to access the given pathname.
 */
export function hasAccess(role: Role, pathname: string): boolean {
  const allowed = ROLE_ALLOWED_PATHS[role];
  return allowed.some((allowedPath) => {
    if (allowedPath === '/') return pathname === '/';
    return pathname === allowedPath || pathname.startsWith(allowedPath + '/');
  });
}

/**
 * Returns true if a path is public (accessible without authentication).
 */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
}
