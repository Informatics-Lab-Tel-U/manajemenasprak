import { ArrowUpRight } from 'lucide-react';
import { Asprak } from '@/types/database';

interface AsprakTableProps {
  data: Asprak[];
  loading: boolean;
  onViewDetails: (asprak: Asprak) => void;
}

export default function AsprakTable({ data, loading, onViewDetails }: AsprakTableProps) {
  if (loading) {
    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>NIM</th>
              <th>Nama Lengkap</th>
              <th>Kode</th>
              <th>Angkatan</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                Loading...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>NIM</th>
              <th>Nama Lengkap</th>
              <th>Kode</th>
              <th>Angkatan</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                No data found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>NIM</th>
            <th>Nama Lengkap</th>
            <th>Kode</th>
            <th>Angkatan</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((asprak) => (
            <tr key={asprak.id}>
              <td>{asprak.nim}</td>
              <td>{asprak.nama_lengkap}</td>
              <td>
                <span className="badge badge-purple">{asprak.kode}</span>
              </td>
              <td>{asprak.angkatan}</td>
              <td>
                <button
                  className="btn"
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    background: 'rgba(255,255,255,0.1)',
                  }}
                  onClick={() => onViewDetails(asprak)}
                >
                  View <ArrowUpRight size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
