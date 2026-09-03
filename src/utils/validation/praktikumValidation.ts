import { PraktikumPreviewRow } from '@/components/praktikum/PraktikumCSVPreview';

export function validatePraktikumData(
  data: any[],
  existingPraktikums: { nama: string; tahun_ajaran: string }[]
): PraktikumPreviewRow[] {
  const preview: PraktikumPreviewRow[] = [];

  const existingMap = new Set(
    existingPraktikums.map((p) => `${p.nama.toUpperCase()}|${p.tahun_ajaran}`)
  );

  const internalMap = new Set<string>();

  data.forEach((row: any) => {
    const nama = (
      row.nama_singkat ||
      row.nama_lengkap ||
      row.nama ||
      row.Nama ||
      row['Nama Singkat'] ||
      ''
    )
      .toString()
      .trim()
      .toUpperCase();
    const tahunAjaran = (row.tahun_ajaran || row['Tahun Ajaran'] || '').toString().trim();

    let status: PraktikumPreviewRow['status'] = 'ok';
    let statusMessage = '';
    let selected = true;

    if (!nama) {
      status = 'error';
      statusMessage = 'Nama kosong';
      selected = false;
    } else if (!tahunAjaran) {
      status = 'error';
      statusMessage = 'Tahun Ajaran kosong';
      selected = false;
    } else {
      const key = `${nama}|${tahunAjaran}`;

      if (existingMap.has(key)) {
        status = 'skipped';
        statusMessage = 'Sudah ada di database';
        selected = false;
      }
      // Check against earlier rows in the same file
      else if (internalMap.has(key)) {
        status = 'skipped';
        statusMessage = 'Duplikat dalam file csv/excel';
        selected = false;
      }

      internalMap.add(key);
    }

    preview.push({
      nama,
      tahun_ajaran: tahunAjaran,
      status,
      statusMessage,
      selected,
    });
  });

  return preview;
}
