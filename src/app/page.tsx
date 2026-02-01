import { Users, BookOpen, Calendar, AlertTriangle } from 'lucide-react';
import { Jadwal } from '@/types/database';
import DashboardCharts from '@/components/DashboardCharts';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStats } from '@/services/databaseService';
import { getTodaySchedule } from '@/services/jadwalService';

export const revalidate = 0;

export default async function Home() {
  const stats = await getStats();
  const todaySchedule = await getTodaySchedule();

  return (
    <div className="container">
      <header className="mb-8">
        <h1 className="title-gradient text-4xl font-bold">Overview</h1>
        <p className="text-muted-foreground mt-1">
          Selamat datang di portal admin Manajemen Asisten Praktikum
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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

      <div className="mb-12">
        <DashboardCharts
          asprakByAngkatan={stats.asprakByAngkatan}
          jadwalByDay={stats.jadwalByDay}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/80 backdrop-blur-sm shadow-md">
          <CardHeader>
            <h3 className="text-xl font-semibold">Jadwal Praktikum Hari Ini</h3>
          </CardHeader>
          <CardContent>
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
                      <td colSpan={4} className="text-center py-4 text-muted-foreground">
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
                          <Badge variant="secondary">{s.ruangan || 'Online'}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm shadow-md">
          <CardHeader>
            <h3 className="text-xl font-semibold">Quick Actions</h3>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button className="w-full">+ Input Pelanggaran</Button>
            <Button variant="outline" className="w-full">
              View Schedule
            </Button>
            <Button variant="outline" className="w-full">
              Manage Asprak Pool
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
