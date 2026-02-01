/**
 * Import API Fetcher (Client-side)
 * Use this for Excel import from client components
 */

import { logger } from '@/lib/logger';

export interface ImportResult {
  ok: boolean;
  message?: string;
  error?: string;
}

export async function uploadExcel(
  file: File,
  term: string,
  options?: { skipConflicts?: boolean }
): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('term', term);
  if (options?.skipConflicts) {
    formData.append('skipConflicts', 'true');
  }

  try {
    const res = await fetch('/api/import', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.error };
    }

    return { ok: true, message: data.message };
  } catch (e: any) {
    logger.error('Import error:', e);
    return { ok: false, error: e.message };
  }
}
