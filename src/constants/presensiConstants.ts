import * as ExcelJS from 'exceljs';

export const PRESENSI_STYLES = {
  COLORS: {
    HEADER_BG: 'FF16365C',
    HEADER_FG: 'FFFFFFFF',
    BAND_1_BG: 'FFDAEEF3',
    BAND_2_BG: 'FFC5D9F1',
  },
  BORDERS: {
    top: { style: 'thin' as ExcelJS.BorderStyle },
    left: { style: 'thin' as ExcelJS.BorderStyle },
    bottom: { style: 'thin' as ExcelJS.BorderStyle },
    right: { style: 'thin' as ExcelJS.BorderStyle },
  },
};

export const PRESENSI_COLUMN_WIDTHS = {
  BASE: {
    NO: 4.28,
    NIM: 13.85,
    NAMA: 44.57,
    KODE_ASPRAK: 13.42,
  },
  MODULE: {
    KEHADIRAN_ASPRAK: 19.14,
    KEHADIRAN: 12.14,
    EVIDENCE: 12.14,
    TP: 12.14,
    JURNAL: 12.14,
    TES_AKHIR: 12.14,
    RATE: 12.14,
    TOTAL_NILAI: 12.14,
    DEFAULT: 12,
  },
  RATA_RATA: 11.85,
};

export const PRESENSI_STRINGS = {
  ATTENDANCE_OPTIONS: ['"HADIR, TIDAK HADIR"'],
  YA_TIDAK_OPTIONS: ['"YA, TIDAK"'],
};
