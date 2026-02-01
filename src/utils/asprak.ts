/**
 * Utility functions for Asprak (Assistant Praktikum) operations
 */

import { ACTIVE_YEARS_THRESHOLD } from '@/constants';
import { Asprak } from '@/types/database';

/**
 * Check if an Asprak is currently active based on their graduation cohort
 * An Asprak is considered active if they graduated within the threshold years
 *
 * @param angkatan - Graduation year (cohort) of the Asprak
 * @returns true if active, false otherwise
 *
 * @example
 * isAsprakActive(2020) // false (if current year is 2026 and threshold is 6)
 * isAsprakActive(2023) // true (if current year is 2026 and threshold is 6)
 */
export function isAsprakActive(angkatan: number): boolean {
  const currentYear = new Date().getFullYear();
  return currentYear - angkatan <= ACTIVE_YEARS_THRESHOLD;
}

/**
 * Check if an Asprak is inactive (opposite of isAsprakActive)
 * Useful for code readability in some contexts
 *
 * @param angkatan - Graduation year of the Asprak
 * @returns true if inactive, false otherwise
 */
export function isAsprakInactive(angkatan: number): boolean {
  return !isAsprakActive(angkatan);
}

/**
 * Filter a list of Aspraks to only include active ones
 * @param aspraks - Array of Asprak objects
 * @returns Filtered array containing only active Aspraks
 */
export function filterActiveAspraks(aspraks: Asprak[]): Asprak[] {
  return aspraks.filter((asprak) => isAsprakActive(asprak.angkatan));
}

/**
 * Filter a list of Aspraks to only include inactive ones
 * @param aspraks - Array of Asprak objects
 * @returns Filtered array containing only inactive Aspraks
 */
export function filterInactiveAspraks(aspraks: Asprak[]): Asprak[] {
  return aspraks.filter((asprak) => isAsprakInactive(asprak.angkatan));
}
