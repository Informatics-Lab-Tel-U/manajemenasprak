import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface CopyOptions {
  copyPraktikum: boolean;
  copyMataKuliah: boolean;
  copyAsprakAssignments: boolean;
}

export interface CopyResult {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

/**
 * Service to handle copying records from one academic term to another.
 * Uses atomic Postgres RPC function 'copy_tahun_ajaran' to ensure rollback on failure.
 */
export async function copyTahunAjaran(
  sourceTerm: string,
  targetTerm: string,
  options: CopyOptions
): Promise<CopyResult> {
  if (!sourceTerm || !targetTerm) {
    return { success: false, message: 'Source dan Target Term harus diisi.' };
  }

  if (sourceTerm === targetTerm) {
    return { success: false, message: 'Source dan Target Term tidak boleh sama.' };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc('copy_tahun_ajaran', {
      p_source_term: sourceTerm,
      p_target_term: targetTerm,
      p_copy_praktikum: options.copyPraktikum,
      p_copy_mata_kuliah: options.copyMataKuliah,
      p_copy_asprak_assignments: options.copyAsprakAssignments
    });

    if (error) {
      logger.error('Error executing copy_tahun_ajaran RPC:', error);
      return { success: false, message: `Gagal menyalin data: ${error.message}`, error };
    }

    // RPC returns JSON object with success, message, and data
    const result = data as any;
    if (!result.success) {
      return { success: false, message: result.message };
    }

    logger.info('Copy Tahun Ajaran successful via RPC', result.data);
    return {
      success: true,
      message: result.message,
      data: result.data
    };

  } catch (error: any) {
    logger.error('CRITICAL: RPC call failed.', error);
    return { 
      success: false, 
      message: error.message || 'Terjadi kesalahan saat menyalin data.',
      error 
    };
  }
}
