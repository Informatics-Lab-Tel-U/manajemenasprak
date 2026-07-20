import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PresensiGeneratorOptions } from '@/types/presensi';
import { addBase, createModul, formatRows } from './generators/kelasSheetGenerator';
import { addAsprakBelumNilaiSheet } from './generators/asprakListSheetGenerator';
import { addRekapSheet, addRekapBroadcastEngine } from './generators/rekapSheetGenerator';

export async function generatePresensiExcel(options: PresensiGeneratorOptions) {
  // Sanity check input
  if (!options || !options.jumlahModul || options.jumlahModul < 1) {
    throw new Error('Jumlah modul tidak valid.');
  }
  if (!options.kelasNames || options.kelasNames.length === 0) {
    throw new Error('Kelas names tidak boleh kosong.');
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Presensi Generator';
  workbook.created = new Date();

  // ── 1. Buat sheet kelas (IT-xx-xx) ────────────────────────────────────────
  const worksheets: ExcelJS.Worksheet[] = [];
  for (const kelasName of options.kelasNames) {
    const safeName = kelasName.substring(0, 31).replace(/[\\/*?:\[\]]/g, '');
    const ws = workbook.addWorksheet(safeName);
    worksheets.push(ws);
  }

  worksheets.forEach((ws) => {
    addBase(ws);
  });

  worksheets.forEach((ws, idxWs) => {
    const setting = options.kelasSettings[idxWs];
    const startDate = setting?.tanggalMulai || new Date();
    for (let iModul = 0; iModul < options.jumlahModul; iModul++) {
      createModul(ws, startDate, options.opsi, iModul + 1);
    }
    formatRows(
      ws,
      options.jumlahModul,
      options.opsi,
      setting?.jumlahPraktikan || 40,
      setting?.jumlahAsprak || 4
    );
  });

  // ── 2. Buat sheet ASPRAK BELUM NILAI dan REKAP (opsional) ──────────────────
  if (options.generateRekapSheet && options.asprakList && options.asprakList.length > 0) {
    // ASPRAK BELUM NILAI harus dibuat SEBELUM REKAP karena REKAP mereferensikan tabel "ASPRAK"
    addAsprakBelumNilaiSheet(workbook, options.asprakList);
    addRekapSheet(workbook, options);
    addRekapBroadcastEngine(workbook, options);
  }

  // ── 3. Export ke file ──────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${options.namaFile || 'presensi'}.xlsx`);
}

export type { AsprakEntry } from '@/types/presensi';
