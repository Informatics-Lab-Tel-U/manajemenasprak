/**
 * Asprak Service (Server-only)
 * Direct Supabase access - DO NOT use in client components
 */

import { supabase } from './supabase';
import { Asprak } from '@/types/database';
import { logger } from '@/lib/logger';
import { checkCodeConflict, generateConflictErrorMessage } from '@/utils/conflict';

export async function getAllAsprak(): Promise<Asprak[]> {
  const { data, error } = await supabase
    .from('Asprak')
    .select('*')
    .order('nim', { ascending: true });

  if (error) {
    logger.error('Error fetching asprak:', error);
    throw new Error(`Failed to fetch asprak: ${error.message}`);
  }
  return data as Asprak[];
}

export async function getExistingCodes(): Promise<string[]> {
  const { data } = await supabase.from('Asprak').select('kode');
  if (!data) return [];
  return Array.from(new Set(data.map((d) => d.kode))).sort();
}

export async function getAsprakAssignments(asprakId: number | string) {
  const { data, error } = await supabase
    .from('Asprak_Praktikum')
    .select(
      `
            id,
            praktikum:Praktikum (
                nama,
                tahun_ajaran
            )
        `
    )
    .eq('id_asprak', asprakId);

  if (error) {
    logger.error('Error fetching assignments:', error);
    throw new Error(`Failed to fetch assignments: ${error.message}`);
  }
  return data || [];
}

export interface UpsertAsprakInput {
  nim: string;
  nama_lengkap: string;
  kode: string;
  angkatan: number;
  term: string;
  praktikumNames: string[];
}

export async function upsertAsprak(input: UpsertAsprakInput): Promise<string> {
  let angkatan = input.angkatan;
  if (angkatan < 100) angkatan += 2000;

  const { data: codeOwner } = await supabase
    .from('Asprak')
    .select('*')
    .eq('kode', input.kode)
    .maybeSingle();

  const conflictCheck = checkCodeConflict(codeOwner, input.nim);
  if (conflictCheck.hasConflict && conflictCheck.existingOwner) {
    throw new Error(generateConflictErrorMessage(input.kode, conflictCheck.existingOwner));
  }

  let asprakId = '';
  const { data: existingUser } = await supabase
    .from('Asprak')
    .select('id')
    .eq('nim', input.nim)
    .maybeSingle();

  if (existingUser) {
    const { error: upError } = await supabase
      .from('Asprak')
      .update({
        nama_lengkap: input.nama_lengkap,
        kode: input.kode,
        angkatan: angkatan,
      })
      .eq('id', existingUser.id);

    if (upError) throw upError;
    asprakId = existingUser.id;
  } else {
    if (codeOwner && codeOwner.nim !== input.nim) {
      await supabase
        .from('Asprak')
        .update({
          kode: `${codeOwner.kode}_EXPIRED_${codeOwner.id.substring(0, 4)}`,
        })
        .eq('id', codeOwner.id);
    }

    const { data: newUser, error: inError } = await supabase
      .from('Asprak')
      .insert({
        nim: input.nim,
        nama_lengkap: input.nama_lengkap,
        kode: input.kode,
        angkatan: angkatan,
      })
      .select()
      .single();

    if (inError) throw inError;
    asprakId = newUser.id;
  }

  for (const mkName of input.praktikumNames) {
    let praktikumId = '';
    const { data: pExist } = await supabase
      .from('Praktikum')
      .select('id')
      .eq('nama', mkName)
      .eq('tahun_ajaran', input.term)
      .maybeSingle();

    if (pExist) {
      praktikumId = pExist.id;
    } else {
      const { data: pNew, error: pError } = await supabase
        .from('Praktikum')
        .insert({ nama: mkName, tahun_ajaran: input.term })
        .select()
        .single();
      if (pError) throw pError;
      praktikumId = pNew.id;
    }

    const { data: linkExist } = await supabase
      .from('Asprak_Praktikum')
      .select('id')
      .eq('id_asprak', asprakId)
      .eq('id_praktikum', praktikumId)
      .maybeSingle();

    if (!linkExist) {
      await supabase.from('Asprak_Praktikum').insert({
        id_asprak: asprakId,
        id_praktikum: praktikumId,
      });
    }
  }

  return asprakId;
}
