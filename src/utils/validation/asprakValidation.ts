import { PreviewRow } from '@/components/asprak/AsprakCSVPreview';
import { batchGenerateCodes } from '@/utils/asprakCodeGenerator';
import type { ExistingAsprakInfo } from '@/components/asprak/AsprakImportCSVModal';

const CODE_RECYCLE_YEARS = 5;

export function validateAsprakData(
  data: any[],
  existingCodes: string[],
  existingNims: string[],
  forceOverride: boolean = false
): PreviewRow[] {
  const usedCodes = new Set(existingCodes.map((c) => c.toUpperCase()));
  const existingNimSet = new Set(existingNims);

  // Map column variations mapped from headers
  const normalizedData = data.map((r: any) => {
    // Find keys case-insensitively
    const keys = Object.keys(r);
    const getVal = (possibleNames: string[]) => {
      for (const p of possibleNames) {
        const found = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === p.toLowerCase().replace(/[^a-z0-9]/g, ''));
        if (found) return r[found];
      }
      return undefined;
    };

    return {
      nama_lengkap: String(getVal(['nama_lengkap', 'namalengkap', 'nama']) || '').trim(),
      nim: String(getVal(['nim']) || '').trim(),
      kode: getVal(['kode']) ? String(getVal(['kode'])).trim() : undefined,
      angkatan: getVal(['angkatan', 'tahun']),
    };
  });

  // Prepare rows for batch code generation
  const rowsForCodeGen = normalizedData.map((row) => ({
    nama_lengkap: row.nama_lengkap,
    kode: row.kode,
  }));

  const generatedCodes = batchGenerateCodes(rowsForCodeGen, forceOverride ? new Set() : usedCodes);

  const preview: PreviewRow[] = [];
  const seenNimsInCSV = new Set<string>();

  for (let idx = 0; idx < normalizedData.length; idx++) {
    const row = normalizedData[idx];
    const namaLengkap = row.nama_lengkap;
    const nim = row.nim;
    const rawAngkatan = row.angkatan;
    let angkatan =
      typeof rawAngkatan === 'number'
        ? rawAngkatan
        : parseInt(String(rawAngkatan || '0'), 10);
    if (angkatan > 0 && angkatan < 100) angkatan += 2000;

    const originalKode = row.kode ? row.kode.toUpperCase() : '';
    const generated = generatedCodes[idx];

    // Determine status
    let status: PreviewRow['status'] = 'ok';
    let statusMessage = '';

    if (!namaLengkap) {
      status = 'error';
      statusMessage = 'Nama kosong';
    } else if (!nim) {
      status = 'error';
      statusMessage = 'NIM kosong';
    } else if (existingNimSet.has(nim)) {
      status = 'error';
      statusMessage = 'Duplikat — NIM sudah ada di database';
    } else if (seenNimsInCSV.has(nim)) {
      status = 'duplicate-csv';
      statusMessage = 'Duplikat dalam CSV — NIM sama dengan row sebelumnya';
    } else if (angkatan <= 0 || isNaN(angkatan)) {
      status = 'warning';
      statusMessage = 'Angkatan tidak valid';
    }

    // Check if code generation failed
    if (generated.rule === 'FAILED' && !originalKode && status === 'ok') {
      status = 'error';
      statusMessage = 'Kode gagal di-generate — isi manual di kolom kode';
    }

    // Track this NIM as seen in current CSV
    if (nim) seenNimsInCSV.add(nim);

    const codeSource: PreviewRow['codeSource'] =
      generated.rule === 'Provided (CSV)' ? 'csv' : 'generated';

    const isDuplicate =
      (status === 'error' && statusMessage.includes('Duplikat')) ||
      status === 'duplicate-csv';
      
    // If forceOverride is true, and originalKode exists in the CSV, we use it directly
    // and ignore DB conflicts (the code generator will still have tried to generate a unique one if we didn't pass empty usedCodes)
    let finalCodeRule = isDuplicate ? 'Duplikat' : generated.rule;
    let finalDisplayKode = isDuplicate && originalKode ? originalKode : generated.code;
    let finalCodeSource = codeSource;
    let finalStatus = status;
    let finalStatusMessage = statusMessage;

    if (forceOverride && originalKode) {
      finalDisplayKode = originalKode;
      if (!isDuplicate) {
        finalCodeRule = 'Provided (CSV) [Forced]';
      }
      finalCodeSource = 'csv';
      // Only clear code generation failures, preserve NIM duplicate errors
      if (finalStatusMessage.includes('Kode gagal di-generate')) {
        finalStatus = 'ok';
        finalStatusMessage = '';
      }
    }

    preview.push({
      nama_lengkap: namaLengkap.toUpperCase(),
      nim,
      kode: finalDisplayKode,
      angkatan: isNaN(angkatan) ? 0 : angkatan,
      codeRule: finalCodeRule,
      codeSource: finalCodeSource,
      status: finalStatus,
      statusMessage: finalStatusMessage,
      // Track originals for tag revert on edit
      originalKode: finalDisplayKode,
      originalCodeRule: finalCodeRule,
      originalCodeSource: finalCodeSource,
      selected: finalStatus === 'ok' || finalStatus === 'warning',
    });
  }

  return preview;
}

export function validateAsprakCodeEdit(
  rowIndex: number,
  newCode: string,
  currentRows: PreviewRow[],
  existingAspraks: ExistingAsprakInfo[],
  forceOverride: boolean = false
): PreviewRow[] {
  const updated = [...currentRows];
  const row = { ...updated[rowIndex] };
  const uppercased = newCode.toUpperCase();
  row.kode = uppercased;

  // ── Tag revert ──
  if (uppercased === row.originalKode) {
    row.codeSource = row.originalCodeSource;
    row.codeRule = row.originalCodeRule;
  } else {
    row.codeSource = 'csv';
    row.codeRule = 'Manual edit';
  }

  // ── Real-time conflict check ──
  if (/^[A-Z]{3}$/.test(uppercased)) {
    const conflictInCSV = updated.some(
      (r, i) =>
        i !== rowIndex &&
        r.kode === uppercased &&
        r.status !== 'error' &&
        r.status !== 'duplicate-csv'
    );

    const conflictInDB = !forceOverride && existingAspraks.some((a) => {
      if (a.kode.toUpperCase() !== uppercased) return false;
      const gap = row.angkatan - a.angkatan;
      return gap < CODE_RECYCLE_YEARS;
    });

    const preserveError = row.status === 'error' && (row.statusMessage?.includes('NIM') || row.statusMessage?.includes('Nama'));
    const preserveDuplicateCsv = row.status === 'duplicate-csv';

    if (conflictInCSV) {
      if (!preserveError && !preserveDuplicateCsv) {
        row.status = 'warning';
        row.statusMessage = `Kode "${uppercased}" sudah dipakai row lain di CSV ini`;
      }
    } else if (conflictInDB) {
      if (!preserveError && !preserveDuplicateCsv) {
        row.status = 'warning';
        row.statusMessage = `Kode "${uppercased}" sudah dipakai asprak lain di DB (< ${CODE_RECYCLE_YEARS} thn)`;
      }
    } else {
      if (!preserveError && !preserveDuplicateCsv) {
        row.status = 'ok';
        row.statusMessage = '';
      }
    }

    if (row.status === 'ok' || row.status === 'warning') {
      if (!row.selected) row.selected = true;
    } else {
      row.selected = false;
    }
  } else if (uppercased.length > 0 && uppercased.length < 3) {
    const preserveError = row.status === 'error' && (row.statusMessage?.includes('NIM') || row.statusMessage?.includes('Nama'));
    const preserveDuplicateCsv = row.status === 'duplicate-csv';
    if (!preserveError && !preserveDuplicateCsv) {
        row.status = 'error';
        row.statusMessage = 'Kode harus 3 huruf';
    }
    row.selected = false;
  } else if (uppercased.length === 0) {
    const preserveError = row.status === 'error' && (row.statusMessage?.includes('NIM') || row.statusMessage?.includes('Nama'));
    const preserveDuplicateCsv = row.status === 'duplicate-csv';
    if (!preserveError && !preserveDuplicateCsv) {
        row.status = 'error';
        row.statusMessage = 'Kode tidak boleh kosong';
    }
    row.selected = false;
  }

  updated[rowIndex] = row;
  return updated;
}
