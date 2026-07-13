import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getPraktikumByTerm } from './praktikumService';

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
 * This is meant to be a robust, best-effort transactional copy.
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
  
  // Track inserted IDs for rollback
  const insertedPraktikumIds: string[] = [];
  const insertedMataKuliahIds: string[] = [];
  const insertedAsprakKoordIds: string[] = [];

  try {
    // 1. Fetch Source Data
    const { data: sourcePraktikums, error: praktikumError } = await supabase
      .from('praktikum')
      .select('*')
      .eq('tahun_ajaran', sourceTerm);
      
    if (praktikumError) throw new Error(`Gagal mengambil data praktikum: ${praktikumError.message}`);
    
    if (!sourcePraktikums || sourcePraktikums.length === 0) {
      return { success: false, message: `Tidak ada data Praktikum pada term ${sourceTerm}` };
    }

    // Check if target term already exists to prevent accidental override/duplication
    const { data: existingTarget } = await supabase
      .from('praktikum')
      .select('id')
      .eq('tahun_ajaran', targetTerm)
      .limit(1);
      
    if (existingTarget && existingTarget.length > 0) {
      return { success: false, message: `Tahun Ajaran ${targetTerm} sudah ada di database.` };
    }

    // Mapping old ID to new ID for relational inserts
    const praktikumIdMap = new Map<string, string>();
    const mataKuliahIdMap = new Map<string, string>(); // ADDED THIS
    const newPraktikumsToInsert = [];

    // --- PHASE 1: Copy Praktikum ---
    if (options.copyPraktikum) {
      for (const sp of sourcePraktikums) {
        const newId = crypto.randomUUID();
        praktikumIdMap.set(sp.id, newId);
        
        newPraktikumsToInsert.push({
          id: newId,
          nama: sp.nama,
          tahun_ajaran: targetTerm,
          // created_at / updated_at handled by DB
        });
        insertedPraktikumIds.push(newId);
      }

      const { error: insertPraktikumError } = await supabase
        .from('praktikum')
        .insert(newPraktikumsToInsert);

      if (insertPraktikumError) throw new Error(`Gagal menyalin praktikum: ${insertPraktikumError.message}`);
      logger.info(`Berhasil menyalin ${newPraktikumsToInsert.length} praktikum.`);
    }

    // --- PHASE 2: Copy Mata Kuliah ---
    if (options.copyMataKuliah && options.copyPraktikum) {
      const sourceIds = sourcePraktikums.map((p: any) => p.id);
      
      const { data: sourceMatkuls, error: matkulError } = await supabase
        .from('mata_kuliah')
        .select('*')
        .in('id_praktikum', sourceIds);

      if (matkulError) throw new Error(`Gagal mengambil data mata kuliah: ${matkulError.message}`);

      if (sourceMatkuls && sourceMatkuls.length > 0) {
        const newMatkulsToInsert = [];
        
        for (const sm of sourceMatkuls) {
          const newTargetPraktikumId = praktikumIdMap.get(sm.id_praktikum);
          if (!newTargetPraktikumId) continue; // safety check

          const newId = crypto.randomUUID();
          mataKuliahIdMap.set(sm.id, newId); // Map old matkul ID to new

          newMatkulsToInsert.push({
            id: newId,
            id_praktikum: newTargetPraktikumId,
            nama_lengkap: sm.nama_lengkap,
            program_studi: sm.program_studi,
            dosen_koor: sm.dosen_koor,
            warna: sm.warna,
          });
          insertedMataKuliahIds.push(newId);
        }

        if (newMatkulsToInsert.length > 0) {
          const { error: insertMatkulError } = await supabase
            .from('mata_kuliah')
            .insert(newMatkulsToInsert);

          if (insertMatkulError) throw new Error(`Gagal menyalin mata kuliah: ${insertMatkulError.message}`);
          logger.info(`Berhasil menyalin ${newMatkulsToInsert.length} mata kuliah.`);
        }
      }
    }

    // --- PHASE 3: Copy Asprak (Koordinator / Penugasan) ---
    // Note: The logic for asprak might vary depending on exact schema constraints,
    // usually koordinator can be mapped if they are bound to tahun_ajaran / praktikum.
    if (options.copyAsprakAssignments && options.copyPraktikum) {
       const sourceIds = sourcePraktikums.map((p: any) => p.id);
       
       const { data: sourceAsprakKoords, error: asprakKoordError } = await supabase
         .from('asprak_koordinator')
         .select('*')
         .in('id_praktikum', sourceIds);

       if (asprakKoordError) throw new Error(`Gagal mengambil data penugasan asprak: ${asprakKoordError.message}`);

       if (sourceAsprakKoords && sourceAsprakKoords.length > 0) {
         const newKoordsToInsert = [];
         
         for (const sak of sourceAsprakKoords) {
            const newTargetPraktikumId = praktikumIdMap.get(sak.id_praktikum);
            if (!newTargetPraktikumId) continue;
            
            // Map the mata_kuliah ID if it was copied
            let newTargetMatkulId = sak.id_mata_kuliah;
            if (options.copyMataKuliah) {
               newTargetMatkulId = mataKuliahIdMap.get(sak.id_mata_kuliah) || sak.id_mata_kuliah;
            }

            const newId = crypto.randomUUID();
            newKoordsToInsert.push({
              id: newId,
              id_pengguna: sak.id_pengguna,
              id_mata_kuliah: newTargetMatkulId, 
              id_praktikum: newTargetPraktikumId,
              tahun_ajaran: targetTerm,
              is_active: sak.is_active
            });
            insertedAsprakKoordIds.push(newId);
         }

         if (newKoordsToInsert.length > 0) {
           const { error: insertKoordError } = await supabase
             .from('asprak_koordinator')
             .insert(newKoordsToInsert);

           if (insertKoordError) throw new Error(`Gagal menyalin koordinator: ${insertKoordError.message}`);
           logger.info(`Berhasil menyalin ${newKoordsToInsert.length} penugasan asprak.`);
         }
       }
    }

    return { 
      success: true, 
      message: 'Berhasil menyalin data Tahun Ajaran.',
      data: {
        praktikumCount: insertedPraktikumIds.length,
        mataKuliahCount: insertedMataKuliahIds.length,
        asprakCount: insertedAsprakKoordIds.length
      }
    };

  } catch (error: any) {
    logger.error('Copy Tahun Ajaran failed, attempting rollback...', error);
    
    // --- BEST EFFORT ROLLBACK ---
    try {
      if (insertedAsprakKoordIds.length > 0) {
         await supabase.from('asprak_koordinator').delete().in('id', insertedAsprakKoordIds);
      }
      if (insertedMataKuliahIds.length > 0) {
         await supabase.from('mata_kuliah').delete().in('id', insertedMataKuliahIds);
      }
      if (insertedPraktikumIds.length > 0) {
         await supabase.from('praktikum').delete().in('id', insertedPraktikumIds);
      }
      logger.info('Rollback berhasil.');
    } catch (rollbackError: any) {
      logger.error('CRITICAL: Rollback failed.', rollbackError);
    }

    return { 
      success: false, 
      message: error.message || 'Terjadi kesalahan saat menyalin data.',
      error 
    };
  }
}
