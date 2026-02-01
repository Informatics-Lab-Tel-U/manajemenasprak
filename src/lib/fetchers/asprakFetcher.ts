/**
 * Asprak API Fetcher (Client-side)
 * Use this for fetch() calls from client components
 */

import { logger } from '@/lib/logger';
import { Asprak } from '@/types/database';
import { ServiceResult } from '@/types/api';

export interface UpsertAsprakInput {
  nim: string;
  nama_lengkap: string;
  kode: string;
  angkatan: number;
  term: string;
  praktikumNames: string[];
}

export interface AsprakAssignment {
  id: number;
  praktikum: {
    nama: string;
    tahun_ajaran: string;
  };
}

export async function fetchAllAsprak(): Promise<ServiceResult<Asprak[]>> {
  try {
    const res = await fetch('/api/asprak');
    const json = await res.json();

    if (!res.ok) {
      return { ok: false, error: json.error };
    }

    return { ok: true, data: json.data };
  } catch (e: any) {
    logger.error('Error fetching asprak:', e);
    return { ok: false, error: e.message };
  }
}

export async function upsertAsprak(input: UpsertAsprakInput): Promise<ServiceResult<string>> {
  try {
    const res = await fetch('/api/asprak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', data: input }),
    });

    const json = await res.json();

    if (!res.ok) {
      return { ok: false, error: json.error };
    }

    return { ok: true, data: json.asprakId };
  } catch (e: any) {
    logger.error('Error upserting asprak:', e);
    return { ok: false, error: e.message };
  }
}

export async function fetchAsprakAssignments(
  asprakId: number | string
): Promise<ServiceResult<AsprakAssignment[]>> {
  try {
    const res = await fetch('/api/asprak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view', asprakId }),
    });

    const json = await res.json();

    if (!res.ok) {
      return { ok: false, error: json.error };
    }

    return { ok: true, data: json.assignments || [] };
  } catch (e: any) {
    logger.error('Error fetching assignments:', e);
    return { ok: false, error: e.message };
  }
}

export async function fetchExistingCodes(): Promise<ServiceResult<string[]>> {
  try {
    const res = await fetch('/api/asprak?action=codes');
    const json = await res.json();

    if (!res.ok) {
      return { ok: false, error: json.error };
    }

    return { ok: true, data: json.codes || [] };
  } catch (e: any) {
    logger.error('Error fetching codes:', e);
    return { ok: false, error: e.message };
  }
}
