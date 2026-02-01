import { AlertTriangle, Plus } from 'lucide-react';
import { Pelanggaran } from '@/types/database';
import { getAllPelanggaran } from '@/services/pelanggaranService';

export const revalidate = 0;

export default async function PelanggaranPage() {
  const violations = await getAllPelanggaran();

  return (
    <div className="container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 className="title-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            Pelanggaran
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Log Indisipliner Asprak</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Catat Pelanggaran
        </button>
      </div>

      <div className="card glass">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tanggal Input</th>
                <th>Asprak</th>
                <th>Pelanggaran</th>
                <th>Konteks Kejadian</th>
                <th>Modul</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {violations.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    No data found.
                  </td>
                </tr>
              ) : (
                violations.map((v) => {
                  const date = new Date(v.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  const mkName = (v.jadwal as any)?.mata_kuliah?.nama_lengkap || 'Unknown MK';
                  const asprakName = v.asprak?.nama_lengkap || 'Unknown';
                  const asprakInfo = `${v.asprak?.kode || '-'} • ${mkName.substring(0, 15)}...`;
                  const jadwalInfo = `${v.jadwal?.hari || '-'}, ${v.jadwal?.jam || '-'}`;
                  const kelasInfo = `Kelas ${v.jadwal?.kelas || '-'}`;

                  return (
                    <tr key={v.id}>
                      <td>{date}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{asprakInfo}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {asprakName}
                        </div>
                      </td>
                      <td>{v.jenis}</td>
                      <td>
                        <div>{jadwalInfo}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {kelasInfo}
                        </div>
                      </td>
                      <td>{v.modul}</td>
                      <td>
                        <span className="badge badge-red">Recorded</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
