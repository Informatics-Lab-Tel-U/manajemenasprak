import * as ExcelJS from 'exceljs';
import { PRESENSI_STYLES, ThemeColors } from '@/constants/presensiConstants';
import { AsprakEntry } from '@/types/presensi';

/**
 * Generate sheet "LIST ASPRAK" sebagai Excel Table bernama "ASPRAK".
 * Sheet ini digunakan sebagai lookup oleh sheet REKAP.
 * Kolom A = Nama Lengkap, Kolom B = Kode
 */
export function addAsprakBelumNilaiSheet(
  workbook: ExcelJS.Workbook,
  asprakList: AsprakEntry[],
  colors: ThemeColors = PRESENSI_STYLES.COLORS
) {
  const ws = workbook.addWorksheet('LIST ASPRAK');
  ws.properties.tabColor = { argb: colors.TAB_LIST_ASPRAK };

  // Lebar kolom
  ws.getColumn(1).width = 4; // Kolom A (margin)
  ws.getColumn(2).width = 44; // Kolom B (Nama Lengkap)
  ws.getColumn(3).width = 18; // Kolom C (Kode)

  // Header style: dark blue, bold, white text
  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: colors.HEADER_FG } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.HEADER_BG } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: PRESENSI_STYLES.BORDERS,
  };

  // Row 2: Headers (B2, C2)
  const headerRow = ws.getRow(2);
  const cellNama = headerRow.getCell(2);
  cellNama.value = 'Nama Lengkap';
  Object.assign(cellNama, headerStyle);

  const cellKode = headerRow.getCell(3);
  cellKode.value = 'Kode';
  Object.assign(cellKode, headerStyle);
  headerRow.height = 20;

  // Data rows (Mulai dari baris 3, warna putih / default)
  asprakList.forEach((asprak, idx) => {
    const rowNum = idx + 3;
    const row = ws.getRow(rowNum);

    const namaCell = row.getCell(2);
    namaCell.value = asprak.nama;
    namaCell.border = PRESENSI_STYLES.BORDERS;
    namaCell.alignment = { vertical: 'middle' };

    const kodeCell = row.getCell(3);
    kodeCell.value = asprak.kode;
    kodeCell.border = PRESENSI_STYLES.BORDERS;
    kodeCell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Excel Table — memungkinkan formula ASPRAK[Nama Lengkap] dan ASPRAK[Kode]
  if (asprakList.length > 0) {
    ws.addTable({
      name: 'ASPRAK',
      ref: 'B2',
      headerRow: true,
      style: {
        theme: 'TableStyleLight1', // Style tabel terang/putih
        showRowStripes: false,
      },
      columns: [
        { name: 'Nama Lengkap', filterButton: false },
        { name: 'Kode', filterButton: false },
      ],
      rows: asprakList.map((a) => [a.nama, a.kode]),
    });
  }
}
