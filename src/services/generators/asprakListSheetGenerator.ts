import * as ExcelJS from 'exceljs';
import { PRESENSI_STYLES } from '@/constants/presensiConstants';
import { AsprakEntry } from '@/types/presensi';

/**
 * Generate sheet "LIST ASPRAK" sebagai Excel Table bernama "ASPRAK".
 * Sheet ini digunakan sebagai lookup oleh sheet REKAP.
 * Kolom A = Nama Lengkap, Kolom B = Kode
 */
export function addAsprakBelumNilaiSheet(
  workbook: ExcelJS.Workbook,
  asprakList: AsprakEntry[]
) {
  const ws = workbook.addWorksheet('LIST ASPRAK');
  ws.properties.tabColor = { argb: PRESENSI_STYLES.COLORS.TAB_LIST_ASPRAK }; // Biru muda

  // Lebar kolom
  ws.getColumn(1).width = 44;
  ws.getColumn(2).width = 18;

  // Header style: dark blue, bold, white text
  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: PRESENSI_STYLES.COLORS.HEADER_FG } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: PRESENSI_STYLES.COLORS.HEADER_BG } },
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: PRESENSI_STYLES.BORDERS,
  };

  // Row 1: Headers
  const headerRow = ws.getRow(1);
  const cellNama = headerRow.getCell(1);
  cellNama.value = 'Nama Lengkap';
  Object.assign(cellNama, headerStyle);

  const cellKode = headerRow.getCell(2);
  cellKode.value = 'Kode';
  Object.assign(cellKode, headerStyle);
  headerRow.height = 20;

  // Data rows
  const bandBg1 = PRESENSI_STYLES.COLORS.BAND_1_BG;
  const bandBg2 = PRESENSI_STYLES.COLORS.BAND_2_BG;

  asprakList.forEach((asprak, idx) => {
    const rowNum = idx + 2;
    const row = ws.getRow(rowNum);
    const isEven = idx % 2 === 0;
    const fillColor = isEven ? bandBg1 : bandBg2;

    const namaCell = row.getCell(1);
    namaCell.value = asprak.nama;
    namaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
    namaCell.border = PRESENSI_STYLES.BORDERS;
    namaCell.alignment = { vertical: 'middle' };

    const kodeCell = row.getCell(2);
    kodeCell.value = asprak.kode;
    kodeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
    kodeCell.border = PRESENSI_STYLES.BORDERS;
    kodeCell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Excel Table — memungkinkan formula ASPRAK[Nama Lengkap] dan ASPRAK[Kode]
  if (asprakList.length > 0) {
    ws.addTable({
      name: 'ASPRAK',
      ref: 'A1',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
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
