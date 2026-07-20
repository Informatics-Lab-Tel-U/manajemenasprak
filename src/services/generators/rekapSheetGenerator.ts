import * as ExcelJS from 'exceljs';
import { PresensiOptions, AsprakEntry } from '../presensiGenerator';
import { PRESENSI_STYLES } from '@/constants/presensiConstants';

/** Konversi nomor kolom (1-based) ke huruf Excel */
function colNumToLetter(col: number): string {
  let letter = '';
  while (col > 0) {
    let temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = (col - temp - 1) / 26;
  }
  return letter;
}

// Helper untuk distribusi baris (dicopy dari presensiGenerator.ts)
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

export function addRekapBroadcastEngine(
  workbook: ExcelJS.Workbook,
  options: PresensiOptions
) {
  // ─── Setup Worksheet ───────────────────────────────────────────────────────
  const ws = workbook.addWorksheet('REKAP');
  ws.properties.tabColor = { argb: 'FFED7D31' }; // Oranye agar sesuai dgn aslinya

  // ─── Tentukan Opsi Kolom (Dinamis sesuai generator kita) ───────────────────
  // Di sheet kelas (modul 1):
  // Col 5 (E) = KEHADIRAN ASPRAK
  // Col 6 (F) = KEHADIRAN (Selalu dievaluasi)
  // Col 7 (G) = EVIDENCE
  // Col 8+ = Optional cols (TP, JURNAL, TES AKHIR, RATE)

  const optionalCols: { name: string; on: boolean; id: string }[] = [
    { name: 'TP', on: options.opsi.tp.enabled, id: 'TP' },
    { name: 'Jurnal', on: options.opsi.jurnal.enabled, id: 'JURNAL' },
    { name: 'Tes Akhir', on: options.opsi.tesAkhir.enabled, id: 'TES AKHIR' },
    { name: 'Rate', on: options.opsi.rate, id: 'RATE' },
  ];

  const numOption = optionalCols.filter((col) => col.on).length;
  const totalColsThisModule = 4 + numOption; // KEHADIRAN ASPRAK, KEHADIRAN, EVIDENCE, TOTAL NILAI (4) + options

  // Mapping koordinat awal (baris 4 pada sheet kelas)
  let currentOffset = 8; // Kolom H (ke-8)
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
        coord: '', // Kalau hide, tidak perlu coord (atau dummy)
        id: col.id,
      });
    }
  }

  // ─── Tabel 1: KELAS (B2:C...) ──────────────────────────────────────────────
  const tbl1HeaderStyle: Partial<ExcelJS.Style> = {
    font: { bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8EA9DB' } },
    alignment: { vertical: 'middle', horizontal: 'left' },
    border: PRESENSI_STYLES.BORDERS,
  };
  const hideColStyle: Partial<ExcelJS.Style> = {
    font: { bold: false },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }, // Kuning
    alignment: { vertical: 'middle', horizontal: 'left' },
    border: PRESENSI_STYLES.BORDERS,
  };
  const valColStyle: Partial<ExcelJS.Style> = {
    border: PRESENSI_STYLES.BORDERS,
    alignment: { vertical: 'middle', horizontal: 'left' },
  };

  ws.getColumn(1).width = 3;
  ws.getColumn(2).width = 12; // Kelas
  ws.getColumn(3).width = 7;  // Hide
  ws.getColumn(4).width = 3;  // Spasi
  ws.getColumn(5).width = 14; // Column
  ws.getColumn(6).width = 7;  // Hide
  ws.getColumn(7).width = 16; // Start Coordinate

  // Header Kelas
  const b2 = ws.getCell('B2'); b2.value = 'Kelas'; b2.style = tbl1HeaderStyle;
  const c2 = ws.getCell('C2'); c2.value = 'Hide'; c2.style = tbl1HeaderStyle;

  options.kelasNames.forEach((kelas: string, idx: number) => {
    const row = idx + 3;
    const b = ws.getCell(`B${row}`); b.value = kelas; b.style = valColStyle;
    const c = ws.getCell(`C${row}`); c.value = false; c.style = hideColStyle;
  });
  const classEndRow = options.kelasNames.length + 2;

  // ─── Tabel 2: COLUMNS (E2:G...) ────────────────────────────────────────────
  const e2 = ws.getCell('E2'); e2.value = 'Column'; e2.style = tbl1HeaderStyle;
  const f2 = ws.getCell('F2'); f2.value = 'Hide'; f2.style = tbl1HeaderStyle;
  const g2 = ws.getCell('G2'); g2.value = 'Start Coordinate'; g2.style = tbl1HeaderStyle;

  columnsControlPanel.forEach((colData, idx) => {
    const row = idx + 3;
    const e = ws.getCell(`E${row}`); e.value = colData.name; e.style = valColStyle;
    const f = ws.getCell(`F${row}`); f.value = colData.hide; f.style = hideColStyle;
    const g = ws.getCell(`G${row}`); g.value = colData.coord; g.style = valColStyle;
  });
  const cpEndRow = columnsControlPanel.length + 2;

  // ─── Parameter Tambahan (E11, E15, E21) ────────────────────────────────────
  // Modul ke-
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

  // Kolom per Modul
  ws.getCell('E15').value = 'Kolom per Modul'; ws.getCell('E15').style = tbl1HeaderStyle;
  ws.mergeCells('E15:F15');
  ws.getCell('E16').value = totalColsThisModule;
  ws.getCell('E16').font = { bold: true, size: 20 };
  ws.getCell('E16').alignment = { horizontal: 'right', vertical: 'middle' };
  ws.getCell('E16').border = PRESENSI_STYLES.BORDERS;
  ws.mergeCells('E16:F17');

  // Sabtu (Dummy agar mirip asli)
  ws.getCell('E21').value = 'Sabtu'; ws.getCell('E21').style = tbl1HeaderStyle;
  const f21 = ws.getCell('F21'); f21.value = true; f21.border = PRESENSI_STYLES.BORDERS;
  f21.dataValidation = { type: 'list', allowBlank: true, formulae: ['"TRUE,FALSE"'] };

  // ─── Estetika "COPY ME!" ───────────────────────────────────────────────────
  ws.getColumn(22).width = 4; // V spasi
  ws.getColumn(23).width = 120; // W Lebar banget untuk WA text
  const w2 = ws.getCell('W2');
  w2.value = 'COPY ME!';
  w2.font = { bold: true };
  w2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B084' } };
  w2.border = PRESENSI_STYLES.BORDERS;
  w2.alignment = { horizontal: 'center', vertical: 'middle' };

  // W3 black background
  const w3 = ws.getCell('W3');
  w3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
  w3.font = { color: { argb: 'FFFFFFFF' } }; // White text
  w3.alignment = { wrapText: true, vertical: 'top' };

  // Nanti W3 akan disetel formula untuk merangkai semua peringatan

  // ─── Engine Formula WhatsApp (Baris 37 ke bawah) ───────────────────────────
  // Sembunyikan baris-baris ini agar rapi jika sheet ditampilkan
  let currentRow = 37;

  // Header untuk kolom-kolom engine
  // I=Nama, J=Kode, K=Kelas, L=rowsInGroup, M=groupStartRow, N=kelasName, O=jumlahAsprak
  const engineHeaders = ['Nama Asprak', 'Kode', 'Kelas', 'RowsInGroup', 'GroupStartRow', 'HelperKelas', 'JmlAsprak'];
  engineHeaders.forEach((h, i) => {
    ws.getCell(`${colNumToLetter(9 + i)}${currentRow - 1}`).value = h;
  });

  // Tulis Header Komponen yang dinilai dinamis (Mulai dari P)
  let pIdx = 16; // P
  const engineColIds: string[] = []; // ex: ['KEHADIRAN', 'TP', 'JURNAL']
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

  // Menyimpan referensi cell FINAL_CLASS_WA per kelas untuk digabung di W3
  const finalClassRefs: string[] = [];

  options.kelasNames.forEach((kelasName: string, kelasIdx: number) => {
    const kelasSet = options.kelasSettings[kelasIdx] || options.kelasSettings[0];
    const numAsprak = kelasSet.jumlahAsprak;
    if (numAsprak <= 0) return;

    // Hitung distribusi baris untuk HelperRow seperti di addRekapSheet
    const dist = getRowDistribution(kelasSet.jumlahPraktikan, kelasSet.jumlahAsprak);
    let groupStartRow = 4;

    for (let idxInClass = 0; idxInClass < numAsprak; idxInClass++) {
      const rowsInGroup = dist[idxInClass];
      const groupEndRow = groupStartRow + rowsInGroup - 1;

      // 1. L: rowsInGroup — jumlah baris praktikan milik asprak ini
      ws.getCell(`L${currentRow}`).value = rowsInGroup;

      // 2. M: groupStartRow — baris awal data asprak ini di sheet kelas
      ws.getCell(`M${currentRow}`).value = groupStartRow;

      // 3. N: HelperKelas — nama sheet kelas untuk INDIRECT
      ws.getCell(`N${currentRow}`).value = kelasName;

      // 4. O: JmlAsprak — jumlah total asprak di kelas ini (digunakan CONCAT_WA via OFFSET)
      ws.getCell(`O${currentRow}`).value = numAsprak;

      // 4. J: Kode Asprak — _xlfn.LET + _xlpm. untuk variable names (OOXML spec)
      const fKode = `_xlfn.LET(_xlpm.ROW_OFFSET,${groupStartRow - 4},_xlpm.COL_OFFSET,($E$12-1)*$E$16,_xlpm.KODE,TRIM(OFFSET(INDIRECT("'"&$N${currentRow}&"'!E4"),_xlpm.ROW_OFFSET,_xlpm.COL_OFFSET)),IF(_xlpm.KODE="","",_xlpm.KODE))`;
      ws.getCell(`J${currentRow}`).value = { formula: fKode, result: '' };

      // 5. I: Nama Asprak (DYNAMIC FORMULA)
      const fNama = `IFERROR(INDEX('LIST ASPRAK'!$A$2:$A$1000,MATCH($J${currentRow},'LIST ASPRAK'!$B$2:$B$1000,0)),"")`;
      ws.getCell(`I${currentRow}`).value = { formula: fNama, result: '' };

      // 6. K: Kelas (hanya terisi jika ada aspraknya. aslinya tidak digabung vertikal)
      ws.getCell(`K${currentRow}`).value = kelasName;

      // 7. Engine Formula (P, Q, R, S...) — _xlfn.LET + _xlpm. variable names (OOXML spec)
      let colPtr = 16; // P
      engineColIds.forEach((compId) => {
        const letter = colNumToLetter(colPtr);
        const coord = columnsControlPanel.find(c => c.id === compId)?.coord || 'A1';

        // Semua nama var: _xlpm.WIDTH, _xlpm.COORDINATE, _xlpm.COL_OFFSET, _xlpm.ROW_OFFSET, _xlpm.VALUE
        // Semua referensi ke var di expression juga pakai _xlpm.
        const formula = `_xlfn.LET(_xlpm.WIDTH,$E$16,_xlpm.COORDINATE,"${coord}",_xlpm.COL_OFFSET,($E$12-1)*_xlpm.WIDTH,_xlpm.ROW_OFFSET,${groupStartRow - 4},_xlpm.VALUE,COUNTBLANK(OFFSET(INDIRECT("'"&$N${currentRow}&"'!"&_xlpm.COORDINATE),_xlpm.ROW_OFFSET,_xlpm.COL_OFFSET,$L${currentRow},1)),IF(INDEX($F$3:$F$8,MATCH(${letter}$36,$E$3:$E$8,0)),"",IF(_xlpm.VALUE=0,"",UPPER(${letter}$36))))`;

        ws.getCell(`${letter}${currentRow}`).value = { formula, result: '' };
        colPtr++;
      });

      // 8. T: YANG_BELUM — _xlfn.LET + _xlpm. variable name (OOXML spec)
      const tLet = yangBelumColLetter;
      const startEng = colNumToLetter(16);
      const endEng = colNumToLetter(colPtr - 1);
      ws.getCell(`${tLet}${currentRow}`).value = {
        formula: `_xlfn.LET(_xlpm.YANG_BELUM,_xlfn.TEXTJOIN(", ",TRUE,${startEng}${currentRow}:${endEng}${currentRow}),IF(_xlpm.YANG_BELUM="","",_xlfn.CONCAT("- ",$J${currentRow},": ",_xlpm.YANG_BELUM)))`,
        result: ''
      };

      // 9. U: CONCAT_WA — _xlfn.TEXTJOIN wajib di OOXML
      const uLet = concatWAColLetter;
      if (idxInClass === 0) {
        ws.getCell(`${uLet}${currentRow}`).value = {
          formula: `_xlfn.TEXTJOIN(CHAR(10),TRUE,OFFSET(${tLet}${currentRow},0,0,$O${currentRow}))`,
          result: ''
        };
      }

      // 10. V39: FINAL_CLASS_WA
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

  // ─── Gabungkan semua teks kelas ke dalam blok Hitam (COPY ME) W3 ──────────
  // _xlfn.TEXTJOIN wajib — fungsi modern tidak ada di base OOXML spec
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
