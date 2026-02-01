/**
 * Utility functions for formatting and parsing academic term strings
 */

/**
 * Format a term string from year and semester
 * @param year - Starting year (e.g., "2024" or 2024)
 * @param semester - Semester number ("1" or "2")
 * @returns Formatted term string (e.g., "20242025-1")
 *
 * @example
 * formatTerm("2024", "1") // "20242025-1"
 * formatTerm(2024, "2") // "20242025-2"
 */
export function formatTerm(year: string | number, semester: '1' | '2'): string {
  const startYear = typeof year === 'string' ? parseInt(year) : year;
  const endYear = startYear + 1;
  return `${startYear}${endYear}-${semester}`;
}
