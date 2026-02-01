'use client';

import { useState, useCallback } from 'react';
import { Trash2, Upload, FileSpreadsheet, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as importFetcher from '@/lib/fetchers/importFetcher';
import * as XLSX from 'xlsx';

export default function DatabasePage() {
  const [termYear, setTermYear] = useState('24');
  const [termSem, setTermSem] = useState<'1' | '2'>('2');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const startY = parseInt(termYear);
      const term = `${startY}${startY + 1}-${termSem}`;

      setLoading(true);
      setStatus({ type: 'info', message: `Processing ${file.name} for term: ${term}...` });

      try {
        const result = await importFetcher.uploadExcel(file, term);

        if (result.ok) {
          setStatus({
            type: 'success',
            message: result.message || `Successfully imported ${file.name}!`,
          });
        } else if (result.error?.includes('CONFLICT:')) {
          const userWantsToSkip = confirm(
            `${result.error}\n\nDo you want to SKIP this conflicting asprak and continue with others?`
          );
          if (userWantsToSkip) {
            setStatus({ type: 'info', message: `Retrying (Skipping Conflicts)...` });
            const retryResult = await importFetcher.uploadExcel(file, term, {
              skipConflicts: true,
            });
            if (retryResult.ok) {
              setStatus({ type: 'success', message: `Imported ${file.name} (Conflicts Skipped)!` });
            } else {
              setStatus({ type: 'error', message: retryResult.error || 'Retry failed' });
            }
          } else {
            setStatus({ type: 'error', message: result.error });
          }
        } else {
          setStatus({ type: 'error', message: result.error || 'Import failed' });
        }
      } catch (e: any) {
        setStatus({ type: 'error', message: e.message || 'Import failed' });
      } finally {
        setLoading(false);
      }
    },
    [termYear, termSem]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
  });

  const handleClear = async () => {
    if (!confirm('WARNING: Ini akan menghapus SEMUA data Jadwal, Asprak, Praktikum, dll. Yakin?'))
      return;

    setLoading(true);
    setStatus({ type: 'info', message: 'Clearing database...' });

    try {
      const res = await fetch('/api/clear', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus({ type: 'success', message: 'Database successfully cleared!' });
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const startY = parseInt(termYear);
    const termStr = `${startY}${startY + 1}-${termSem}`;

    const praktikumRows = [
      { nama_singkat: 'PBO', tahun_ajaran: termStr },
      { nama_singkat: 'ALPRO', tahun_ajaran: termStr },
      { nama_singkat: 'JARKOM', tahun_ajaran: termStr },
    ];
    const wsPraktikum = XLSX.utils.json_to_sheet(praktikumRows);
    XLSX.utils.book_append_sheet(wb, wsPraktikum, 'praktikum');

    const mkRows = [
      {
        mk_singkat: 'PBO',
        program_studi: 'IF',
        nama_lengkap: 'Pemrograman Berorientasi Objek',
        dosen_koor: 'ABC',
      },
      {
        mk_singkat: 'ALPRO',
        program_studi: 'SE',
        nama_lengkap: 'Algoritma Pemrograman',
        dosen_koor: 'DEF',
      },
      {
        mk_singkat: 'JARKOM',
        program_studi: 'IF',
        nama_lengkap: 'Jaringan Komputer',
        dosen_koor: 'GHI',
      },
    ];
    const wsMk = XLSX.utils.json_to_sheet(mkRows);
    XLSX.utils.book_append_sheet(wb, wsMk, 'mata_kuliah');

    const asprakRows = [
      { nim: '1201210001', nama_lengkap: 'Budi Santoso', kode: 'BDS', angkatan: '21' },
      { nim: '1201210002', nama_lengkap: 'Siti Aminah', kode: 'SIT', angkatan: '21' },
      { nim: '1201210003', nama_lengkap: 'Ahmad Dani', kode: 'ADM', angkatan: '21' },
    ];
    const wsAsprak = XLSX.utils.json_to_sheet(asprakRows);
    XLSX.utils.book_append_sheet(wb, wsAsprak, 'asprak');

    const jadwalRows = [
      {
        kelas: 'IF-45-01',
        nama_singkat: 'PBO',
        hari: 'SENIN',
        sesi: 1,
        jam: '06:30',
        ruangan: 'TULT 0612',
        total_asprak: 2,
        dosen: 'ABC',
      },
      {
        kelas: 'SE-45-02',
        nama_singkat: 'ALPRO',
        hari: 'SELASA',
        sesi: 2,
        jam: '08:30',
        ruangan: 'GKU 0201',
        total_asprak: 3,
        dosen: 'DEF',
      },
      {
        kelas: 'IF-45-03',
        nama_singkat: 'JARKOM',
        hari: 'RABU',
        sesi: 3,
        jam: '10:30',
        ruangan: 'TULT 0505',
        total_asprak: 2,
        dosen: 'GHI',
      },
    ];
    const wsJadwal = XLSX.utils.json_to_sheet(jadwalRows);
    XLSX.utils.book_append_sheet(wb, wsJadwal, 'jadwal');

    const pivotRows = [
      { kode_asprak: 'BDS', mk_singkat: 'PBO' },
      { kode_asprak: 'SIT', mk_singkat: 'ALPRO' },
      { kode_asprak: 'ADM', mk_singkat: 'JARKOM' },
    ];
    const wsPivot = XLSX.utils.json_to_sheet(pivotRows);
    XLSX.utils.book_append_sheet(wb, wsPivot, 'asprak_praktikum');

    XLSX.writeFile(wb, `${termStr}_TEMPLATE.xlsx`);
  };

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="title-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
          Database Manager{' '}
          <span style={{ fontSize: '1rem', opacity: 0.6, fontWeight: 'normal' }}>
            (Developer Mode)
          </span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage imports and cleanup</p>
      </header>

      {status && (
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius)',
            marginBottom: '2rem',
            background:
              status.type === 'error'
                ? 'rgba(239, 68, 68, 0.1)'
                : status.type === 'success'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(59, 130, 246, 0.1)',
            color:
              status.type === 'error'
                ? 'var(--danger)'
                : status.type === 'success'
                  ? 'var(--success)'
                  : 'var(--primary)',
            border: `1px solid ${
              status.type === 'error'
                ? 'var(--danger)'
                : status.type === 'success'
                  ? 'var(--success)'
                  : 'var(--primary)'
            }`,
          }}
        >
          {status.message}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gap: '2rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        }}
      >
        {/* Import Section - Dropzone */}
        <div className="card glass">
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}
          >
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--primary)',
              }}
            >
              <Upload size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Import Excel Dataset</h3>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
              }}
            >
              Tahun Ajaran
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ position: 'relative', width: '80px' }}>
                <input
                  required
                  type="number"
                  min="10"
                  max="99"
                  placeholder="YY"
                  value={termYear}
                  onChange={(e) => setTermYear(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--card-border)',
                    borderRadius: 'var(--radius)',
                    color: 'white',
                    textAlign: 'center',
                  }}
                />
              </div>

              <span style={{ color: 'var(--text-muted)' }}>/</span>

              <div
                style={{
                  width: '80px',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                }}
              >
                {termYear ? parseInt(termYear) + 1 : 'YY'}
              </div>

              <span style={{ color: 'var(--text-muted)' }}>-</span>

              <select
                value={termSem}
                onChange={(e) => setTermSem(e.target.value as '1' | '2')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 'var(--radius)',
                  color: 'white',
                }}
              >
                <option value="1">1 (Ganjil)</option>
                <option value="2">2 (Genap)</option>
              </select>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Isi ini untuk otomatis mengisi tahun ajaran jika di Excel kosong.
            </p>
          </div>

          <div
            {...getRootProps()}
            style={{
              border: '2px dashed var(--card-border)',
              borderRadius: 'var(--radius)',
              padding: '3rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragActive ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
              transition: 'all 0.2s',
              marginBottom: '1rem',
            }}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet
              size={48}
              style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}
            />
            {isDragActive ? (
              <p style={{ color: 'var(--primary)', fontWeight: 600 }}>
                Drop the Excel file here...
              </p>
            ) : (
              <div>
                <p
                  style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: '0.5rem' }}
                >
                  Drag & drop dataset .xlsx here
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  or click to select file
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1rem' }}>
                  Must contain sheets: praktikum, mata_kuliah, asprak, jadwal, asprak_praktikum
                </p>
              </div>
            )}

            {loading && <p style={{ marginTop: '1rem', color: 'var(--warning)' }}>Processing...</p>}
          </div>

          {/* Download Template Button */}
          <button
            onClick={handleDownloadTemplate}
            className="btn"
            style={{
              width: '100%',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid var(--success)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Download size={16} /> Download Template Excel
          </button>
          <p
            style={{
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}
          >
            Template includes example rows. Reference files also available in app assets
            (public/references).
          </p>
        </div>

        {/* Danger Zone */}
        <div className="card glass" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}
          >
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--danger)',
              }}
            >
              <Trash2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--danger)' }}>
              Danger Zone
            </h3>
          </div>

          <p
            style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}
          >
            Tindakan ini tidak dapat dibatalkan. Pastikan Anda tahu apa yang Anda lakukan.
          </p>

          <button
            onClick={handleClear}
            disabled={loading}
            className="btn"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              border: '1px solid var(--danger)',
              width: '100%',
            }}
          >
            Clear All Database Content
          </button>
        </div>
      </div>
    </div>
  );
}
