import { MataKuliahCSVRow } from '@/components/mata-kuliah/MataKuliahCSVPreview';
import type { MataKuliahGrouped } from '@/services/mataKuliahService';

export function validateMataKuliahData(
  data: any[],
  localValidPraktikums: { id: string; nama: string }[],
  existingMataKuliah: MataKuliahGrouped[]
): MataKuliahCSVRow[] {
  const isValidProdi = (prodi: string) => {
    const base = prodi?.replace('-PJJ', '') || '';
    return ['IF', 'IT', 'SE', 'DS'].includes(base);
  };

  const internalMap = new Set<string>();

  return data.map((r: any) => {
    // Fallbacks for different header formats (e.g. from template vs random casing)
    const mk_singkat = (r.mk_singkat || r['Nama Singkat'] || r.nama_singkat || r['MK Singkat'] || '').toString().trim();
    const nama_lengkap = (r.nama_lengkap || r['Nama Lengkap'] || '').toString().trim();
    const program_studi = (r.program_studi || r['Program Studi'] || r.prodi || r.Prodi || '').toString().trim().toUpperCase();
    const dosen_koor = (r.dosen_koor || r['Dosen Koor'] || r.koor || '').toString().trim().toUpperCase();

    // Use localValidPraktikums for validation
    const isMkKnown = localValidPraktikums.some((p) => p.nama.toUpperCase() === mk_singkat.toUpperCase());
    const isProdiValid = isValidProdi(program_studi);
    const isKoorValid = dosen_koor.length === 3;

    let status: 'ok' | 'warning' | 'error' = 'ok';
    let statusMessage = '';

    const key = `${mk_singkat.toUpperCase()}|${program_studi.toUpperCase()}`;

    // Check Duplicates
    // existingMataKuliah is grouped by mk_singkat
    const existingGroup = existingMataKuliah.find((g) => g.mk_singkat.toUpperCase() === mk_singkat.toUpperCase());
    const isDuplicate = existingGroup?.items.some(
      (item) => item.program_studi.toUpperCase() === program_studi.toUpperCase()
    );

    if (isDuplicate) {
      status = 'error';
      statusMessage = 'Data Duplikat di Database';
    } else if (internalMap.has(key)) {
      status = 'error';
      statusMessage = 'Duplikat dalam file csv/excel';
    } else if (!isKoorValid || !isProdiValid) {
      status = 'error';
      statusMessage = 'Data Tidak Valid (Prodi/Dosen)';
    } else if (!isMkKnown) {
      // Allow unknown MK - it will be created automatically by backend
      status = 'ok';
      statusMessage = 'Praktikum baru akan dibuat otomatis';
    } else if (!mk_singkat || !nama_lengkap) {
      status = 'error';
      statusMessage = 'Field Wajib Kurang';
    }

    if (mk_singkat && program_studi) {
        internalMap.add(key);
    }

    return {
      mk_singkat,
      nama_lengkap,
      program_studi,
      dosen_koor,
      status,
      statusMessage,
      originalMkSingkat: mk_singkat,
      selected: status !== 'error', // Default select valid rows
    };
  });
}
