import { Users, BookOpen, Calendar, AlertTriangle } from 'lucide-react';
import { Jadwal } from '@/types/database';
import DashboardCharts from '@/components/DashboardCharts';
import { StatCard } from '@/components/ui/StatCard';
import { getStats } from '@/services/databaseService';
import { getTodaySchedule } from '@/services/jadwalService';

export const revalidate = 0;

export default async function Home() {
  const stats = await getStats();
  const todaySchedule = await getTodaySchedule();

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="title-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
          Dashboard Overview
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Welcome back, Admin. Here's what's happening today.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem',
        }}
      >
        <StatCard
          title="Total Asprak"
          value={stats.asprakCount}
          subtitle="Registered in system"
          icon={Users}
          trend="Active"
          color="purple"
        />
        <StatCard
          title="Total Jadwal"
          value={stats.jadwalCount}
          subtitle="Classes scheduled"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Jadwal Hari Ini"
          value={todaySchedule.length}
          subtitle="Sessions today"
          icon={Calendar}
          color="green"
        />
        <StatCard
          title="Pelanggaran"
          value={stats.pelanggaranCount}
          subtitle="Total recorded"
          icon={AlertTriangle}
          trend="Needs review"
          color="red"
        />
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <DashboardCharts
          asprakByAngkatan={stats.asprakByAngkatan}
          jadwalByDay={stats.jadwalByDay}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card glass">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>
            Jadwal Praktikum Hari Ini
          </h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Jam</th>
                  <th>Mata Kuliah</th>
                  <th>Kelas</th>
                  <th>Ruangan</th>
                </tr>
              </thead>
              <tbody>
                {todaySchedule.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}
                    >
                      No schedule for today (
                      {new Date().toLocaleDateString('id-ID', { weekday: 'long' })}).
                    </td>
                  </tr>
                ) : (
                  todaySchedule.map((s) => (
                    <tr key={s.id}>
                      <td>{s.jam}</td>
                      <td>{s.mata_kuliah?.nama_lengkap}</td>
                      <td>{s.kelas}</td>
                      <td>
                        <span className="badge badge-blue">{s.ruangan || 'Online'}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card glass">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              + Input Pelanggaran
            </button>
            <button
              className="btn"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', width: '100%' }}
            >
              View Schedule
            </button>
            <button
              className="btn"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white', width: '100%' }}
            >
              Manage Asprak Pool
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
