/**
 * Build a term string from year + semester values.
 * @example buildTermString('24', '2') => '2425-2'
 */
export function buildTermString(year: string, sem: '1' | '2'): string {
  const y = parseInt(year);
  if (isNaN(y)) return '';
  return `${y}${y + 1}-${sem}`;
}
