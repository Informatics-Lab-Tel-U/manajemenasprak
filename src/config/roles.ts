/**
 * User roles in the system.
 * Defined in isolation to prevent circular dependencies between auth and rbac configs.
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  ASLAB: 'ASLAB',
  ASPRAK_KOOR: 'ASPRAK_KOOR',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = [ROLES.ADMIN, ROLES.ASLAB, ROLES.ASPRAK_KOOR];
