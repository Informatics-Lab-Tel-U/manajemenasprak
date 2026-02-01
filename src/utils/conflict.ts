/**
 * Utility functions for detecting and resolving Asprak code conflicts
 */

import { Asprak } from '@/types/database';
import { isAsprakInactive } from './asprak';

export interface ConflictCheckResult {
  hasConflict: boolean;
  reason?: string;
  existingOwner?: Asprak;
  canRecycle: boolean;
}

/**
 * Check if a code assignment creates a conflict with an existing code owner
 *
 * A conflict occurs when:
 * 1. The code is already taken by someone else (different NIM)
 * 2. The existing owner is still active (within threshold years)
 *
 * @param existingOwner - Current owner of the code (if any)
 * @param newNim - NIM of the person trying to use the code
 * @returns Conflict check result with details
 *
 * @example
 * checkCodeConflict(existingAsprak, "123456789")
 * // { hasConflict: true, reason: "Code taken by active user", canRecycle: false }
 */
export function checkCodeConflict(
  existingOwner: Asprak | null,
  newNim: string
): ConflictCheckResult {
  // No conflict if code is not taken
  if (!existingOwner) {
    return {
      hasConflict: false,
      canRecycle: true,
    };
  }

  // Same person - no conflict
  const isSamePerson = existingOwner.nim === newNim;
  if (isSamePerson) {
    return {
      hasConflict: false,
      existingOwner,
      canRecycle: false,
    };
  }

  // Different person - check if owner is inactive
  const ownerIsInactive = isAsprakInactive(existingOwner.angkatan);

  if (ownerIsInactive) {
    // Code can be recycled from inactive user
    return {
      hasConflict: false,
      existingOwner,
      canRecycle: true,
      reason: 'Previous owner is inactive, code can be recycled',
    };
  }

  // Active owner, different person - conflict!
  return {
    hasConflict: true,
    existingOwner,
    canRecycle: false,
    reason: `Code is currently assigned to active user: ${existingOwner.nama_lengkap}`,
  };
}

/**
 * Generate a conflict error message
 * @param code - The conflicting code
 * @param existingOwner - Current owner of the code
 * @returns Error message string
 */
export function generateConflictErrorMessage(code: string, existingOwner: Asprak): string {
  return `CONFLICT: Code '${code}' is currently assigned to ${existingOwner.nama_lengkap} (${existingOwner.nim}) who is still active. Codes can only be recycled after the owner becomes inactive.`;
}

/**
 * Generate an expired code suffix for recycling
 * Creates a unique identifier by appending "_EXPIRED_" and part of the ID
 *
 * @param originalCode - Original code to expire
 * @param ownerId - ID of the owner whose code is being expired
 * @returns New expired code string
 *
 * @example
 * generateExpiredCode("ARS", "abc123def456") // "ARS_EXPIRED_abc1"
 */
export function generateExpiredCode(originalCode: string, ownerId: string): string {
  const idPrefix = ownerId.substring(0, 4);
  return `${originalCode}_EXPIRED_${idPrefix}`;
}
