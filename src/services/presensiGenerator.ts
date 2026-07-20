import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { addDays, format, startOfDay } from 'date-fns';
import { PRESENSI_STYLES, PRESENSI_COLUMN_WIDTHS, PRESENSI_STRINGS } from '@/constants/presensiConstants';

export interface PresensiOptions {
  namaFile: string;
  kelasNames: string[];
  jumlahModul: number;
  kelasSettings: {
    tanggalMulai?: Date;
    jumlahPraktikan: number;
    jumlahAsprak: number;
  }[];
  opsi: {
    tp: { enabled: boolean; weight: number; inputType: 'number' | 'boolean' };
    jurnal: { enabled: boolean; weight: number; inputType: 'number' | 'boolean' };
    tesAkhir: { enabled: boolean; weight: number; inputType: 'number' | 'boolean' };
    rate: boolean;
  };
}

function applyHeaderStyle(cell: ExcelJS.Cell) {
  cell.font = { bold: true, color: { argb: PRESENSI_STYLES.COLORS.HEADER_FG } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: PRESENSI_STYLES.COLORS.HEADER_BG },
  };
  cell.border = PRESENSI_STYLES.BORDERS;
}

function getRowDistribution(totalRows: number, numGroups: number): number[] {
  if (numGroups <= 0) return [totalRows];
  const base = Math.floor(totalRows / numGroups);
  const remainder = totalRows % numGroups;
  const dist: number[] = [];
  for (let i = 0; i < numGroups; i++) {
    dist.push(base + (i < remainder ? 1 : 0));
  }
  return dist;
}

function addBase(sheet: ExcelJS.Worksheet) {
  // Add base columns NO, NIM, NAMA, KODE ASPRAK
  sheet.mergeCells('A1:A3');
  sheet.getCell('A1').value = 'NO.';
  sheet.mergeCells('B1:B3');
  sheet.getCell('B1').value = 'NIM';
  sheet.mergeCells('C1:C3');
  sheet.getCell('C1').value = 'NAMA';
  sheet.mergeCells('D1:D3');
  sheet.getCell('D1').value = 'KODE ASPRAK';

  const baseHeaders = ['A1', 'B1', 'C1', 'D1'];
  baseHeaders.forEach((cellId) => {
    applyHeaderStyle(sheet.getCell(cellId));
  });

  // Set Column Widths based on XML reference
  sheet.getColumn(1).width = PRESENSI_COLUMN_WIDTHS.BASE.NO;
  sheet.getColumn(2).width = PRESENSI_COLUMN_WIDTHS.BASE.NIM;
  sheet.getColumn(3).width = PRESENSI_COLUMN_WIDTHS.BASE.NAMA;
  sheet.getColumn(4).width = PRESENSI_COLUMN_WIDTHS.BASE.KODE_ASPRAK;

  // Freeze panes (3 rows, 4 columns)
  // topLeftCell: sel pertama di panel kanan-bawah (setelah freeze),
  // agar Excel tahu posisi scroll awal yang benar — tanpa ini kolom A-D
  // bisa tampak "tergeser" dan tertutup saat user scroll ke pojok kiri.
  // Catatan: activePane tidak ada di tipe WorksheetViewFrozen ExcelJS,
  // hanya tersedia di WorksheetViewSplit — topLeftCell sudah cukup.
  sheet.views = [{ state: 'frozen', ySplit: 3, xSplit: 4, topLeftCell: 'E4' }];
}

function createModul(
  sheet: ExcelJS.Worksheet,
  startDate: Date,
  opsi: PresensiOptions['opsi'],
  modulNum: number
) {
  const optionalCols: { name: string; on: boolean }[] = [
    { name: 'TP', on: opsi.tp.enabled },
    { name: 'JURNAL', on: opsi.jurnal.enabled },
    { name: 'TES AKHIR', on: opsi.tesAkhir.enabled },
    { name: 'RATE', on: opsi.rate },
  ];
  const selectedOptionNames = optionalCols.reduce<string[]>((acc, col) => {
    if (col.on) acc.push(col.name);
    return acc;
  }, []);
  const numOption = selectedOptionNames.length;

  const totalColsThisModule = 4 + numOption;
  const startCol = (modulNum - 1) * totalColsThisModule + 5;
  const modulDate = addDays(startOfDay(startDate), (modulNum - 1) * 7);

  // Merge for MODUL {modulNum}
  sheet.mergeCells(1, startCol, 1, startCol + totalColsThisModule - 1);
  const modulCell = sheet.getCell(1, startCol);
  modulCell.value = `MODUL ${modulNum}`;

  // Merge for Date
  sheet.mergeCells(2, startCol, 2, startCol + totalColsThisModule - 1);
  const dateCell = sheet.getCell(2, startCol);
  dateCell.value = format(modulDate, 'dd/MM/yyyy');

  // Add sub-headers in row 3
  let colPointer = startCol;
  const subHeaders = [
    'KEHADIRAN ASPRAK',
    'KEHADIRAN',
    'EVIDENCE',
    ...selectedOptionNames,
    'TOTAL NILAI',
  ];

  subHeaders.forEach((headerText) => {
    const c = sheet.getCell(3, colPointer);
    c.value = headerText;

    // Set exact column widths matching XML
    if (headerText === 'KEHADIRAN ASPRAK') {
      sheet.getColumn(colPointer).width = PRESENSI_COLUMN_WIDTHS.MODULE.KEHADIRAN_ASPRAK;
    } else if (headerText === 'KEHADIRAN') {
      sheet.getColumn(colPointer).width = PRESENSI_COLUMN_WIDTHS.MODULE.KEHADIRAN;
    } else if (headerText === 'EVIDENCE') {
      sheet.getColumn(colPointer).width = PRESENSI_COLUMN_WIDTHS.MODULE.EVIDENCE;
    } else if (headerText === 'TP') {
      sheet.getColumn(colPointer).width = PRESENSI_COLUMN_WIDTHS.MODULE.TP;
    } else if (headerText === 'JURNAL' || headerText === 'TES AKHIR') {
      sheet.getColumn(colPointer).width = PRESENSI_COLUMN_WIDTHS.MODULE.JURNAL;
    } else if (headerText === 'RATE') {
      sheet.getColumn(colPointer).width = PRESENSI_COLUMN_WIDTHS.MODULE.RATE;
    } else if (headerText === 'TOTAL NILAI') {
      sheet.getColumn(colPointer).width = PRESENSI_COLUMN_WIDTHS.MODULE.TOTAL_NILAI;
    } else {
      sheet.getColumn(colPointer).width = PRESENSI_COLUMN_WIDTHS.MODULE.DEFAULT;
    }
    colPointer++;
  });

  // Apply styling to all cells in the module header
  for (let r = 1; r <= 3; r++) {
    for (let c = startCol; c < startCol + totalColsThisModule; c++) {
      const cell = sheet.getCell(r, c);
      if (cell.type !== ExcelJS.ValueType.Merge || cell.address === sheet.getCell(r, c).master.address) {
        applyHeaderStyle(cell);
      } else {
        const mc = sheet.getCell(r, c);
        mc.border = PRESENSI_STYLES.BORDERS;
      }
    }
  }
}

function injectRowValidationAndFormulas(
  sheet: ExcelJS.Worksheet,
  r: number,
  numModules: number,
  totalColsThisModule: number,
  opsi: PresensiOptions['opsi'],
  fillColor: string
) {
  // Base cells A-D
  for (let c = 1; c <= 4; c++) {
    const cell = sheet.getCell(r, c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
    cell.border = PRESENSI_STYLES.BORDERS;
    if (c === 1) cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  // Module cells
  for (let m = 0; m < numModules; m++) {
    const startCol = m * totalColsThisModule + 5;

    for (let c = startCol; c < startCol + totalColsThisModule; c++) {
      const cell = sheet.getCell(r, c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
      cell.border = PRESENSI_STYLES.BORDERS;

      // Alignment
      if (c !== startCol + 2) { // EVIDENCE normally left aligned if text, but let's center all
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    }

    // KEHADIRAN Dropdown
    const kehadiranColStr = sheet.getColumn(startCol + 1).letter;
    sheet.getCell(`${kehadiranColStr}${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: PRESENSI_STRINGS.ATTENDANCE_OPTIONS,
      showErrorMessage: true,
      showInputMessage: true,
    };

    // TOTAL NILAI Formula
    let tpCol = '', jurnalCol = '', tesAkhirCol = '';
    let currentOffset = startCol + 3;
    if (opsi.tp.enabled) {
      tpCol = sheet.getColumn(currentOffset).letter;
      if (opsi.tp.inputType === 'boolean') {
        sheet.getCell(`${tpCol}${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: PRESENSI_STRINGS.YA_TIDAK_OPTIONS, showErrorMessage: true, showInputMessage: true,
        };
      }
      currentOffset++;
    }
    if (opsi.jurnal.enabled) {
      jurnalCol = sheet.getColumn(currentOffset).letter;
      if (opsi.jurnal.inputType === 'boolean') {
        sheet.getCell(`${jurnalCol}${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: PRESENSI_STRINGS.YA_TIDAK_OPTIONS, showErrorMessage: true, showInputMessage: true,
        };
      }
      currentOffset++;
    }
    if (opsi.tesAkhir.enabled) {
      tesAkhirCol = sheet.getColumn(currentOffset).letter;
      if (opsi.tesAkhir.inputType === 'boolean') {
        sheet.getCell(`${tesAkhirCol}${r}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: PRESENSI_STRINGS.YA_TIDAK_OPTIONS, showErrorMessage: true, showInputMessage: true,
        };
      }
      currentOffset++;
    }

    const totalNilaiCol = sheet.getColumn(startCol + totalColsThisModule - 1).letter;
    const totalNilaiCell = sheet.getCell(`${totalNilaiCol}${r}`);

    const formulaParts = [];
    if (tpCol && opsi.tp.inputType === 'number' && opsi.tp.weight > 0) {
      formulaParts.push(`${tpCol}${r}*${opsi.tp.weight / 100}`);
    }
    if (jurnalCol && opsi.jurnal.inputType === 'number' && opsi.jurnal.weight > 0) {
      formulaParts.push(`${jurnalCol}${r}*${opsi.jurnal.weight / 100}`);
    }
    if (tesAkhirCol && opsi.tesAkhir.inputType === 'number' && opsi.tesAkhir.weight > 0) {
      formulaParts.push(`${tesAkhirCol}${r}*${opsi.tesAkhir.weight / 100}`);
    }

    if (formulaParts.length > 0) {
      totalNilaiCell.value = { formula: formulaParts.join('+'), result: 0 };
    } else {
      totalNilaiCell.value = 0; // Default if nothing is weighted
    }
  }
}

function applyVerticalMerges(
  sheet: ExcelJS.Worksheet,
  numModules: number,
  totalColsThisModule: number,
  dist: number[]
) {
  let currentRow = 4;
  for (let groupIndex = 0; groupIndex < dist.length; groupIndex++) {
    const rowsInGroup = dist[groupIndex];
    if (rowsInGroup <= 0) continue;

    const startRow = currentRow;
    const endRow = currentRow + rowsInGroup - 1;

    // Merge KODE ASPRAK (Col D)
    if (endRow > startRow) {
      sheet.mergeCells(startRow, 4, endRow, 4);
    }
    sheet.getCell(startRow, 4).alignment = { horizontal: 'center', vertical: 'middle' };

    // Merge KEHADIRAN ASPRAK
    for (let m = 0; m < numModules; m++) {
      const startCol = m * totalColsThisModule + 5;
      if (endRow > startRow) {
        sheet.mergeCells(startRow, startCol, endRow, startCol);
      }
      sheet.getCell(startRow, startCol).alignment = { horizontal: 'center', vertical: 'middle' };
    }

    currentRow += rowsInGroup;
  }
}

function formatRows(
  sheet: ExcelJS.Worksheet,
  numModules: number,
  opsi: PresensiOptions['opsi'],
  jumlahPraktikan: number,
  jumlahAsprak: number
) {
  const numOption = [opsi.tp.enabled, opsi.jurnal.enabled, opsi.tesAkhir.enabled, opsi.rate].filter(Boolean).length;
  const totalColsThisModule = 4 + numOption;
  const rataCol = 5 + (numModules * totalColsThisModule);

  // Create RATA RATA Header
  sheet.mergeCells(1, rataCol, 3, rataCol);
  const rataCell = sheet.getCell(1, rataCol);
  rataCell.value = 'RATA RATA';
  applyHeaderStyle(rataCell);
  sheet.getColumn(rataCol).width = PRESENSI_COLUMN_WIDTHS.RATA_RATA;

  const totalNilaiColLetters: string[] = [];
  for (let m = 0; m < numModules; m++) {
    const startCol = m * totalColsThisModule + 5;
    totalNilaiColLetters.push(sheet.getColumn(startCol + totalColsThisModule - 1).letter);
  }

  const dist = getRowDistribution(jumlahPraktikan, jumlahAsprak);
  let currentRow = 4;

  for (let groupIndex = 0; groupIndex < dist.length; groupIndex++) {
    const rowsInGroup = dist[groupIndex];
    const isBand1 = groupIndex % 2 === 0;
    const fillColor = isBand1 ? PRESENSI_STYLES.COLORS.BAND_1_BG : PRESENSI_STYLES.COLORS.BAND_2_BG;

    for (let i = 0; i < rowsInGroup; i++) {
      const r = currentRow + i;
      injectRowValidationAndFormulas(sheet, r, numModules, totalColsThisModule, opsi, fillColor);

      // RATA RATA Formula
      const rataCellRow = sheet.getCell(r, rataCol);
      rataCellRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
      rataCellRow.border = PRESENSI_STYLES.BORDERS;
      rataCellRow.alignment = { horizontal: 'center', vertical: 'middle' };

      if (totalNilaiColLetters.length > 0) {
        const avgCells = totalNilaiColLetters.map((col) => `${col}${r}`).join(',');
        rataCellRow.value = { formula: `AVERAGE(${avgCells})`, result: 0 };
      }
    }
    currentRow += rowsInGroup;
  }

  applyVerticalMerges(sheet, numModules, totalColsThisModule, dist);
}

export async function generatePresensiExcel(options: PresensiOptions) {
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

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `${options.namaFile || 'presensi'}.xlsx`);
}
