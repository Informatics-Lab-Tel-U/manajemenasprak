import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/server';
import { requireRoleApi } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-error';
import { processExcelImport } from '@/services/importService';

export async function POST(req: Request) {
  try {
    const guard = await requireRoleApi(['ADMIN']);
    if (!guard.ok) return guard.response;

    const supabase = await createClient();
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const term = formData.get('term') as string;
    const skipConflicts = formData.get('skipConflicts') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer);

    const sheets = {
      praktikum: wb.Sheets['praktikum'],
      mk: wb.Sheets['mata_kuliah'],
      asprak: wb.Sheets['asprak'],
      jadwal: wb.Sheets['jadwal'],
      pivot: wb.Sheets['asprak_praktikum'],
    };

    if (!sheets.praktikum || !sheets.mk || !sheets.asprak || !sheets.jadwal || !sheets.pivot) {
      return NextResponse.json(
        {
          error:
            'Missing required sheets. Excel must contain: praktikum, mata_kuliah, asprak, jadwal, asprak_praktikum',
        },
        { status: 400 }
      );
    }

    const praktikumData = XLSX.utils.sheet_to_json<any>(sheets.praktikum);
    const mkData = XLSX.utils.sheet_to_json<any>(sheets.mk);
    const asprakData = XLSX.utils.sheet_to_json<any>(sheets.asprak);
    const jadwalData = XLSX.utils.sheet_to_json<any>(sheets.jadwal);
    const pivotData = XLSX.utils.sheet_to_json<any>(sheets.pivot);

    try {
      const result = await processExcelImport(
        {
          praktikum: praktikumData,
          mk: mkData,
          asprak: asprakData,
          jadwal: jadwalData,
          pivot: pivotData,
        },
        term,
        skipConflicts,
        supabase
      );

      return NextResponse.json({ success: true, message: `Imported ${result.jadwalInserted} schedules` });
    } catch (e: any) {
      return apiErrorResponse(e, 'POST /api/import (rollback)');
    }
  } catch (err) {
    return apiErrorResponse(err, 'POST /api/import');
  }
}
