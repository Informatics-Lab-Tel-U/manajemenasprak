import * as ExcelJS from 'exceljs';
import { PRESENSI_STYLES } from '@/constants/presensiConstants';

export function applyHeaderStyle(cell: ExcelJS.Cell) {
  cell.font = { bold: true, color: { argb: PRESENSI_STYLES.COLORS.HEADER_FG } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: PRESENSI_STYLES.COLORS.HEADER_BG },
  };
  cell.border = PRESENSI_STYLES.BORDERS;
}

export function getRowDistribution(totalRows: number, numGroups: number): number[] {
  if (numGroups <= 0) return [totalRows];
  const base = Math.floor(totalRows / numGroups);
  const remainder = totalRows % numGroups;
  const dist: number[] = [];
  for (let i = 0; i < numGroups; i++) {
    dist.push(base + (i < remainder ? 1 : 0));
  }
  return dist;
}

/** Konversi nomor kolom (1-based) ke huruf Excel (A, B, ..., Z, AA, ...) */
export function colNumToLetter(col: number): string {
  let letter = '';
  while (col > 0) {
    const rem = (col - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}
