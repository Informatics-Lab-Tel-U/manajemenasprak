import * as ExcelJS from 'exceljs';
import { PRESENSI_STYLES } from '@/constants/presensiConstants';
import { PresensiGeneratorOptions } from '@/types/presensi';
import { colNumToLetter, getRowDistribution } from './utils';

/**
 * Generate sheet "REKAP" yang merangkum kelengkapan nilai per asprak per modul.
 * Menggunakan formula COUNTBLANK yang mereferensikan sheet kelas.
 *
 * Struktur kolom REKAP:
 *   A  = (border/empty)
 *   B  = Nama Asprak (formula lookup ke tabel ASPRAK)
 *   C  = Kode Asprak (formula ref ke col D sheet kelas)
 *   D  = Nama Kelas (static)
 *   E  = Jumlah Praktikan per asprak (hidden helper)
 *   F  = Start row data grup asprak di sheet kelas (hidden)
 *   G  = End row data grup asprak di sheet kelas (hidden)
 *   H+ = Per modul: jumlah cell kosong (COUNTBLANK)
 *   Last col = Total blank semua modul
 */
export function addRekapSheet(
  workbook: ExcelJS.Workbook,
  options: PresensiGeneratorOptions
) {
  const { kelasNames, kelasSettings, jumlahModul, opsi } = options;

  // Hitung jumlah kolom per modul (sama persis dengan sheet kelas)
  const numOption = [opsi.tp.enabled, opsi.jurnal.enabled, opsi.tesAkhir.enabled, opsi.rate].filter(Boolean).length;
  const totalColsThisModule = 4 + numOption; // KEHADIRAN ASPRAK + KEHADIRAN + EVIDENCE + optional + TOTAL NILAI

  // Di sheet kelas: kolom 1-4 = base (NO, NIM, NAMA, KODE ASPRAK), modul 1 mulai dari col 5
  const BASE_COLS = 4;
  const MODUL_START_COL = BASE_COLS + 1; // = 5 (col E di sheet kelas)

  // Hitung offset kolom optional per modul
  const optionalOrder = [
    { key: 'tp', enabled: opsi.tp.enabled },
    { key: 'jurnal', enabled: opsi.jurnal.enabled },
    { key: 'tesAkhir', enabled: opsi.tesAkhir.enabled },
    { key: 'rate', enabled: opsi.rate },
  ];
  const enabledOptionalIndices: number[] = []; // offset dalam modul (0-based) untuk setiap optional yang aktif
  let optOffset = 3;
  for (const opt of optionalOrder) {
    if (opt.enabled) {
      enabledOptionalIndices.push(optOffset);
      optOffset++;
    }
  }

  // ─── Setup worksheet ───────────────────────────────────────────────────────
  const ws = workbook.addWorksheet('ASPRAK BELUM NILAI');
  ws.properties.tabColor = { argb: 'FFC00000' }; // Merah

  const COL_A = 1;
  const COL_NAMA = 2;   // B
  const COL_KODE = 3;   // C
  const COL_KELAS = 4;  // D
  const COL_JPR = 5;    // E — jumlahPraktikan per asprak (hidden)
  const COL_SROW = 6;   // F — start row di sheet kelas (hidden)
  const COL_EROW = 7;   // G — end row di sheet kelas (hidden)
  const COL_MODUL1 = 8; // H — Modul 1

  // Sembunyikan helper columns
  ws.getColumn(COL_JPR).hidden = true;
  ws.getColumn(COL_SROW).hidden = true;
  ws.getColumn(COL_EROW).hidden = true;

  // Lebar kolom
  ws.getColumn(COL_A).width = 3;
  ws.getColumn(COL_NAMA).width = 30;
  ws.getColumn(COL_KODE).width = 8;
  ws.getColumn(COL_KELAS).width = 18;
  for (let m = 0; m < jumlahModul; m++) {
    ws.getColumn(COL_MODUL1 + m).width = 10;
  }

  // ─── Row 1: Header row (frozen) ────────────────────────────────────────────
  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: PRESENSI_STYLES.COLORS.HEADER_FG } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: PRESENSI_STYLES.COLORS.HEADER_BG } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
    border: PRESENSI_STYLES.BORDERS,
  };

  const row2 = ws.getRow(2);
  row2.height = 36;

  function setHeaderCell(row: ExcelJS.Row, colIdx: number, value: string) {
    const cell = row.getCell(colIdx);
    cell.value = value;
    Object.assign(cell, headerStyle);
  }

  const startDate = kelasSettings[0]?.tanggalMulai || new Date();
  const year = startDate.getFullYear();
  const month = startDate.getMonth() + 1;
  const day = startDate.getDate();

  const cellNamaHeader = row2.getCell(COL_NAMA);
  cellNamaHeader.value = {
    formula: `_xlfn.LET(_xlpm.WEEK,INT((TODAY()-DATE(${year},${month},${day}))/7)+1," NAMA ASPRAK (MODUL "&_xlpm.WEEK&")")`,
    result: 'Nama Asprak'
  };
  Object.assign(cellNamaHeader, headerStyle);
  setHeaderCell(row2, COL_KODE, 'Kode');
  setHeaderCell(row2, COL_KELAS, 'Kelas');

  for (let m = 0; m < jumlahModul; m++) {
    setHeaderCell(row2, COL_MODUL1 + m, `Modul ${m + 1}`);
  }

  ws.views = [{ state: 'frozen', ySplit: 2, xSplit: 4, topLeftCell: 'E3' }];

  let currentRow = 3;

  for (let kelasIdx = 0; kelasIdx < kelasNames.length; kelasIdx++) {
    const kelasName = kelasNames[kelasIdx];
    const setting = kelasSettings[kelasIdx];
    const jumlahPraktikan = setting?.jumlahPraktikan || 40;
    const jumlahAsprak = setting?.jumlahAsprak || 4;

    const dist = getRowDistribution(jumlahPraktikan, jumlahAsprak);
    const DATA_START_ROW = 4;
    let groupStartRow = DATA_START_ROW;

    for (let asprakIdx = 0; asprakIdx < dist.length; asprakIdx++) {
      const rowsInGroup = dist[asprakIdx];
      if (rowsInGroup <= 0) continue;

      const groupEndRow = groupStartRow + rowsInGroup - 1;
      const isAlt = asprakIdx % 2 === 0;
      const fillColor = isAlt ? PRESENSI_STYLES.COLORS.BAND_1_BG : PRESENSI_STYLES.COLORS.BAND_2_BG;

      const row = ws.getRow(currentRow);
      row.height = 18;

      function styleCell(colIdx: number, value: ExcelJS.CellValue | { formula: string; result?: ExcelJS.CellValue }, alignment: Partial<ExcelJS.Alignment> = {}) {
        const cell = row.getCell(colIdx);
        if (typeof value === 'object' && value !== null && 'formula' in value) {
          cell.value = value as ExcelJS.CellValue;
        } else {
          cell.value = value as ExcelJS.CellValue;
        }
        cell.border = PRESENSI_STYLES.BORDERS;
        cell.alignment = { vertical: 'middle', ...alignment };
        if (fillColor) {
           cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        }
      }

      const kodeRef = `$C${currentRow}`;
      styleCell(
        COL_NAMA,
        { formula: `IFERROR(INDEX(ASPRAK[Nama Lengkap],MATCH(${kodeRef},ASPRAK[Kode],0)),"")`, result: '' },
        {}
      );

      const formulaKode = `_xlfn.LET(_xlpm.WEEK,INT((TODAY()-DATE(${year},${month},${day}))/7),_xlpm.ROW_OFFSET,SUM(INDIRECT(_xlfn.CONCAT($F${currentRow},":",ADDRESS(ROW($E${currentRow}),COLUMN($E${currentRow})))))-$E${currentRow},_xlpm.COL_OFFSET,_xlpm.WEEK*${totalColsThisModule},_xlpm.KODE_ASPRAK,TRIM(OFFSET(INDIRECT(_xlfn.CONCAT("'",$G${currentRow},"'!E4")),_xlpm.ROW_OFFSET,_xlpm.COL_OFFSET)),IFERROR(IF(_xlpm.KODE_ASPRAK="","",_xlpm.KODE_ASPRAK),""))`;
      styleCell(
        COL_KODE,
        {
          formula: formulaKode,
          result: '',
        },
        { horizontal: 'center' }
      );

      styleCell(COL_KELAS, asprakIdx === 0 ? kelasName : '', { horizontal: 'center' });
      styleCell(COL_JPR, rowsInGroup, { horizontal: 'center' });
      
      styleCell(
        COL_SROW,
        { formula: `IF(D${currentRow}<>"",ADDRESS(ROW($E${currentRow}),COLUMN($E${currentRow})),$F${currentRow - 1})`, result: '' },
        { horizontal: 'center' }
      );

      styleCell(
        COL_EROW,
        { formula: `IF(D${currentRow}<>"",D${currentRow},G${currentRow - 1})`, result: '' },
        { horizontal: 'center' }
      );

      const modulColLetters: string[] = [];

      for (let m = 0; m < jumlahModul; m++) {
        const colIdx = COL_MODUL1 + m;
        const modulOffset = m * totalColsThisModule;

        let formulaCountBlank = `COUNTBLANK(OFFSET(INDIRECT(_xlfn.CONCAT("'",$G${currentRow},"'!F4")),_xlpm.ROW_OFFSET,${modulOffset},$E${currentRow}))`;

        if (enabledOptionalIndices.length > 0) {
          const firstOpt = enabledOptionalIndices[0];
          const optLetter = colNumToLetter(MODUL_START_COL + firstOpt);
          const numOpts = enabledOptionalIndices.length;
          formulaCountBlank += `+COUNTBLANK(OFFSET(INDIRECT(_xlfn.CONCAT("'",$G${currentRow},"'!${optLetter}4")),_xlpm.ROW_OFFSET,${modulOffset},$E${currentRow},${numOpts}))`;
        }

        const formulaModul = `_xlfn.LET(_xlpm.ROW_OFFSET,SUM(INDIRECT(_xlfn.CONCAT($F${currentRow},":",ADDRESS(ROW($E${currentRow}),COLUMN($E${currentRow})))))-$E${currentRow},_xlpm.KODE_ASPRAK,OFFSET(INDIRECT(_xlfn.CONCAT("'",$G${currentRow},"'!E4")),_xlpm.ROW_OFFSET,${modulOffset}),IF(_xlpm.KODE_ASPRAK="","",${formulaCountBlank}))`;

        const modCell = row.getCell(colIdx);
        modCell.value = { formula: formulaModul, result: 0 };
        modCell.border = PRESENSI_STYLES.BORDERS;
        modCell.alignment = { vertical: 'middle', horizontal: 'center' };
        modCell.numFmt = ';;;';
        if (fillColor) {
           modCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
        }

        modulColLetters.push(colNumToLetter(colIdx));
      }

      currentRow++;
      groupStartRow = groupEndRow + 1;
    }

    const classStartRowInRekap = currentRow - dist.length;
    const classEndRowInRekap = currentRow - 1;
    if (dist.length > 0) {
      const modulStartLetter = colNumToLetter(COL_MODUL1);
      const modulEndLetter = colNumToLetter(COL_MODUL1 + jumlahModul - 1);
      const firstCell = `${modulStartLetter}${classStartRowInRekap}`;
      const cfRef = `${modulStartLetter}${classStartRowInRekap}:${modulEndLetter}${classEndRowInRekap}`;

      ws.addConditionalFormatting({
        ref: cfRef,
        rules: [
          {
            type: 'expression',
            priority: 1,
            formulae: [`LEN(TRIM(${firstCell}))=0`]
          },
          {
            type: 'cellIs',
            priority: 2,
            operator: 'greaterThan',
            formulae: ['0'],
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFF0000' } }, // Merah solid
            },
          },
          {
            type: 'cellIs',
            priority: 3,
            operator: 'equal',
            formulae: ['0'],
            style: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FF92D050' } }, // Hijau solid
            },
          }
        ],
      });
    }

    if (dist.length > 1) {
      ws.mergeCells(classStartRowInRekap, COL_KELAS, classEndRowInRekap, COL_KELAS);
    }
  }
}

export function addRekapBroadcastEngine(
  workbook: ExcelJS.Workbook,
  options: PresensiGeneratorOptions
) {
  const ws = workbook.addWorksheet('REKAP');
  ws.properties.tabColor = { argb: 'FFED7D31' };

  const optionalCols: { name: string; on: boolean; id: string }[] = [
    { name: 'TP', on: options.opsi.tp.enabled, id: 'TP' },
    { name: 'Jurnal', on: options.opsi.jurnal.enabled, id: 'JURNAL' },
    { name: 'Tes Akhir', on: options.opsi.tesAkhir.enabled, id: 'TES AKHIR' },
    { name: 'Rate', on: options.opsi.rate, id: 'RATE' },
  ];

  const numOption = optionalCols.filter((col) => col.on).length;
  const totalColsThisModule = 4 + numOption; 

  let currentOffset = 8;
  const columnsControlPanel = [
    { name: 'Kehadiran', hide: false, coord: 'F4', id: 'KEHADIRAN' },
  ];

  for (const col of optionalCols) {
    if (col.on) {
      columnsControlPanel.push({
        name: col.name,
        hide: false,
        coord: `${colNumToLetter(currentOffset)}4`,
        id: col.id,
      });
      currentOffset++;
    } else {
      columnsControlPanel.push({
        name: col.name,
        hide: true,
        coord: '',
        id: col.id,
      });
    }
  }

  const tbl1HeaderStyle: Partial<ExcelJS.Style> = {
    font: { bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8EA9DB' } },
    alignment: { vertical: 'middle', horizontal: 'left' },
    border: PRESENSI_STYLES.BORDERS,
  };
  const hideColStyle: Partial<ExcelJS.Style> = {
    font: { bold: false },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }, 
    alignment: { vertical: 'middle', horizontal: 'left' },
    border: PRESENSI_STYLES.BORDERS,
  };
  const valColStyle: Partial<ExcelJS.Style> = {
    border: PRESENSI_STYLES.BORDERS,
    alignment: { vertical: 'middle', horizontal: 'left' },
  };

  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 12;
  ws.getColumn(3).width = 7; 
  ws.getColumn(4).width = 3; 
  ws.getColumn(5).width = 14; 
  ws.getColumn(6).width = 7; 
  ws.getColumn(7).width = 16; 

  const b2 = ws.getCell('B2'); b2.value = 'Kelas'; b2.style = tbl1HeaderStyle;
  const c2 = ws.getCell('C2'); c2.value = 'Hide'; c2.style = tbl1HeaderStyle;

  options.kelasNames.forEach((kelas: string, idx: number) => {
    const row = idx + 3;
    const b = ws.getCell(`B${row}`); b.value = kelas; b.style = valColStyle;
    const c = ws.getCell(`C${row}`); c.value = false; c.style = hideColStyle;
  });

  const e2 = ws.getCell('E2'); e2.value = 'Column'; e2.style = tbl1HeaderStyle;
  const f2 = ws.getCell('F2'); f2.value = 'Hide'; f2.style = tbl1HeaderStyle;
  const g2 = ws.getCell('G2'); g2.value = 'Start Coordinate'; g2.style = tbl1HeaderStyle;

  columnsControlPanel.forEach((colData, idx) => {
    const row = idx + 3;
    const e = ws.getCell(`E${row}`); e.value = colData.name; e.style = valColStyle;
    const f = ws.getCell(`F${row}`); f.value = colData.hide; f.style = hideColStyle;
    const g = ws.getCell(`G${row}`); g.value = colData.coord; g.style = valColStyle;
  });

  ws.getCell('E11').value = 'Modul ke-'; ws.getCell('E11').style = tbl1HeaderStyle;
  ws.mergeCells('E11:F11');
  ws.getCell('E12').value = {
    formula: `IF(INT((TODAY()-DATE(2026,2,23))/7)<=3,INT((TODAY()-DATE(2026,2,23))/7),IF(INT((TODAY()-DATE(2026,2,23))/7)<=5,4,INT((TODAY()-DATE(2026,2,23))/7)-1))`,
    result: 1
  };
  ws.getCell('E12').font = { bold: true, size: 20 };
  ws.getCell('E12').alignment = { horizontal: 'right', vertical: 'middle' };
  ws.getCell('E12').border = PRESENSI_STYLES.BORDERS;
  ws.mergeCells('E12:F13');

  ws.getCell('E15').value = 'Kolom per Modul'; ws.getCell('E15').style = tbl1HeaderStyle;
  ws.mergeCells('E15:F15');
  ws.getCell('E16').value = totalColsThisModule;
  ws.getCell('E16').font = { bold: true, size: 20 };
  ws.getCell('E16').alignment = { horizontal: 'right', vertical: 'middle' };
  ws.getCell('E16').border = PRESENSI_STYLES.BORDERS;
  ws.mergeCells('E16:F17');

  ws.getCell('E21').value = 'Sabtu'; ws.getCell('E21').style = tbl1HeaderStyle;
  const f21 = ws.getCell('F21'); f21.value = true; f21.border = PRESENSI_STYLES.BORDERS;
  f21.dataValidation = { type: 'list', allowBlank: true, formulae: ['"TRUE,FALSE"'] };

  ws.getColumn(22).width = 4;
  ws.getColumn(23).width = 120;
  const w2 = ws.getCell('W2');
  w2.value = 'COPY ME!';
  w2.font = { bold: true };
  w2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B084' } };
  w2.border = PRESENSI_STYLES.BORDERS;
  w2.alignment = { horizontal: 'center', vertical: 'middle' };

  const w3 = ws.getCell('W3');
  w3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
  w3.font = { color: { argb: 'FFFFFFFF' } }; 
  w3.alignment = { wrapText: true, vertical: 'top' };

  let currentRow = 37;

  const engineHeaders = ['Nama Asprak', 'Kode', 'Kelas', 'RowsInGroup', 'GroupStartRow', 'HelperKelas', 'JmlAsprak'];
  engineHeaders.forEach((h, i) => {
    ws.getCell(`${colNumToLetter(9 + i)}${currentRow - 1}`).value = h;
  });

  let pIdx = 16; 
  const engineColIds: string[] = [];
  columnsControlPanel.forEach(c => {
    if (!c.hide) {
      ws.getCell(`${colNumToLetter(pIdx)}${currentRow - 1}`).value = c.id;
      engineColIds.push(c.id);
      pIdx++;
    }
  });

  const yangBelumColLetter = colNumToLetter(pIdx);
  ws.getCell(`${yangBelumColLetter}${currentRow - 1}`).value = 'YANG_BELUM';
  const concatWAColLetter = colNumToLetter(pIdx + 1);
  ws.getCell(`${concatWAColLetter}${currentRow - 1}`).value = 'CONCAT_WA';
  const finalClassColLetter = colNumToLetter(pIdx + 2);
  ws.getCell(`${finalClassColLetter}${currentRow - 1}`).value = 'FINAL_CLASS_WA';

  const finalClassRefs: string[] = [];

  options.kelasNames.forEach((kelasName: string, kelasIdx: number) => {
    const kelasSet = options.kelasSettings[kelasIdx] || options.kelasSettings[0];
    const numAsprak = kelasSet.jumlahAsprak;
    if (numAsprak <= 0) return;

    const dist = getRowDistribution(kelasSet.jumlahPraktikan, kelasSet.jumlahAsprak);
    let groupStartRow = 4;

    for (let idxInClass = 0; idxInClass < numAsprak; idxInClass++) {
      const rowsInGroup = dist[idxInClass];
      const groupEndRow = groupStartRow + rowsInGroup - 1;

      ws.getCell(`L${currentRow}`).value = rowsInGroup;
      ws.getCell(`M${currentRow}`).value = groupStartRow;
      ws.getCell(`N${currentRow}`).value = kelasName.substring(0, 31).replace(/[\\/*?:\[\]]/g, '');
      ws.getCell(`O${currentRow}`).value = numAsprak;

      const fKode = `_xlfn.LET(_xlpm.ROW_OFFSET,${groupStartRow - 4},_xlpm.COL_OFFSET,($E$12-1)*$E$16,_xlpm.KODE,TRIM(OFFSET(INDIRECT("'"&$N${currentRow}&"'!E4"),_xlpm.ROW_OFFSET,_xlpm.COL_OFFSET)),IF(_xlpm.KODE="","",_xlpm.KODE))`;
      ws.getCell(`J${currentRow}`).value = { formula: fKode, result: '' };

      const fNama = `IFERROR(INDEX('LIST ASPRAK'!$B$3:$B$1000,MATCH($J${currentRow},'LIST ASPRAK'!$C$3:$C$1000,0)),"")`;
      ws.getCell(`I${currentRow}`).value = { formula: fNama, result: '' };
      ws.getCell(`K${currentRow}`).value = kelasName;

      let colPtr = 16;
      engineColIds.forEach((compId) => {
        const letter = colNumToLetter(colPtr);
        const coord = columnsControlPanel.find(c => c.id === compId)?.coord || 'A1';
        const formula = `_xlfn.LET(_xlpm.WIDTH,$E$16,_xlpm.COORDINATE,"${coord}",_xlpm.COL_OFFSET,($E$12-1)*_xlpm.WIDTH,_xlpm.ROW_OFFSET,${groupStartRow - 4},_xlpm.VALUE,COUNTBLANK(OFFSET(INDIRECT("'"&$N${currentRow}&"'!"&_xlpm.COORDINATE),_xlpm.ROW_OFFSET,_xlpm.COL_OFFSET,$L${currentRow},1)),IF(INDEX($F$3:$F$8,MATCH(${letter}$36,$E$3:$E$8,0)),"",IF(_xlpm.VALUE=0,"",UPPER(${letter}$36))))`;
        ws.getCell(`${letter}${currentRow}`).value = { formula, result: '' };
        colPtr++;
      });

      const tLet = yangBelumColLetter;
      const startEng = colNumToLetter(16);
      const endEng = colNumToLetter(colPtr - 1);
      ws.getCell(`${tLet}${currentRow}`).value = {
        formula: `_xlfn.LET(_xlpm.YANG_BELUM,_xlfn.TEXTJOIN(", ",TRUE,${startEng}${currentRow}:${endEng}${currentRow}),IF(_xlpm.YANG_BELUM="","",_xlfn.CONCAT("- ",$J${currentRow},": ",_xlpm.YANG_BELUM)))`,
        result: ''
      };

      const uLet = concatWAColLetter;
      if (idxInClass === 0) {
        ws.getCell(`${uLet}${currentRow}`).value = {
          formula: `_xlfn.TEXTJOIN(CHAR(10),TRUE,OFFSET(${tLet}${currentRow},0,0,$O${currentRow}))`,
          result: ''
        };
      }

      const vLet = finalClassColLetter;
      if (idxInClass === 0) {
        ws.getCell(`${vLet}${currentRow}`).value = {
          formula: `IF(${uLet}${currentRow}="","","*"&$K${currentRow}&"*"&CHAR(10)&${uLet}${currentRow}&CHAR(10))`,
          result: ''
        };
        finalClassRefs.push(`${vLet}${currentRow}`);
      }

      currentRow++;
      groupStartRow = groupEndRow + 1;
    }
  });

  if (finalClassRefs.length > 0) {
    w3.value = {
      formula: `_xlfn.TEXTJOIN(CHAR(10),TRUE,$${finalClassColLetter}$37:$${finalClassColLetter}$${currentRow - 1})`,
      result: ''
    };
  }

  // Hide engine rows & columns
  // Rows: row 36 (header) sampai baris terakhir engine
  for (let r = 36; r < currentRow; r++) {
    ws.getRow(r).hidden = true;
  }
  // Columns: H(8) sampai V(22) — semua engine columns di-hide
  // H tidak terpakai tapi di-hide agar gap antara G dan COPY ME bersih
  for (let c = 8; c <= 22; c++) {
    ws.getColumn(c).hidden = true;
  }
}
