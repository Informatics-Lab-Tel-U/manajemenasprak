import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as pelanggaranService from '@/services/pelanggaranService';
import * as XLSX from 'xlsx';
import { logger } from '@/lib/logger';

/**
 * GET /api/pelanggaran/export
 * Query params:
 *   - id_praktikum: (optional) filter by praktikum ID
 *   - tahun_ajaran: (optional) filter by academic year
 *
 * Returns an Excel (.xlsx) file with columns:
 *   NIM | NAMA | KODE ASPRAK | MODUL | KELAS | PELANGGARAN
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const idPraktikum = searchParams.get('id_praktikum') ?? undefined;
    const tahunAjaran = searchParams.get('tahun_ajaran') ?? undefined;

    const rows = await pelanggaranService.getExportData(idPraktikum, tahunAjaran, supabase);

    // Build worksheet
    const wsData = [
      ['NIM', 'NAMA', 'KODE ASPRAK', 'MODUL', 'KELAS', 'PELANGGARAN'],
      ...rows.map((r) => [r.nim, r.nama, r.kode_asprak, r.modul, r.kelas, r.pelanggaran]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 18 }, // NIM
      { wch: 30 }, // NAMA
      { wch: 14 }, // KODE ASPRAK
      { wch: 10 }, // MODUL
      { wch: 10 }, // KELAS
      { wch: 26 }, // PELANGGARAN
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pelanggaran');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filename = tahunAjaran
      ? `pelanggaran_${tahunAjaran.replace(/\//g, '-')}.xlsx`
      : 'pelanggaran_export.xlsx';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    logger.error('API Error in /api/pelanggaran/export:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

