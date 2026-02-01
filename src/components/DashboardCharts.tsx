'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function DashboardCharts({
  asprakByAngkatan,
  jadwalByDay,
}: {
  asprakByAngkatan: { name: string; count: number }[];
  jadwalByDay: { name: string; count: number }[];
}) {
  const dataAsprak = [...asprakByAngkatan].sort((a, b) => parseInt(a.name) - parseInt(b.name));

  const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const dataJadwal = [...jadwalByDay].sort(
    (a, b) => dayOrder.indexOf(a.name) - dayOrder.indexOf(b.name)
  );

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F'];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem',
        marginTop: '1.5rem',
      }}
    >
      {/* Chart 1: Asprak per Angkatan */}
      <div className="card glass">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          Total Asprak per Angkatan
        </h3>
        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataAsprak}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar
                dataKey="count"
                fill="var(--primary)"
                name="Jumlah Asprak"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Jadwal per Hari */}
      <div className="card glass">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>
          Distribusi Jadwal per Hari
        </h3>
        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataJadwal}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar
                dataKey="count"
                fill="var(--secondary)"
                name="Total Kelas"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Placeholder for Jadwal Pengganti Analysis */}
      <div className="card glass" style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 600 }}>
          Analisis Jadwal Pengganti
        </h3>
        <p style={{ color: 'var(--text-muted)' }}>
          Belum ada data jadwal pengganti yang tercatat tahun ini.
        </p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem' }}>
          <div>
            <span
              style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)' }}
            >
              Total Pengganti (YTD)
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>0</span>
          </div>
          <div>
            <span
              style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)' }}
            >
              Ratio vs Reguler
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>0%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
