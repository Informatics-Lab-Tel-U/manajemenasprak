'use client';

import { Users, BookOpen, AlertTriangle, Calendar } from 'lucide-react';
import dynamic from 'next/dynamic';

const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), { ssr: false });
import { StatCard } from '@/components/ui/StatCard';
import RealtimeMonitoringWidget from '@/components/RealtimeMonitoringWidget';


import type { DashboardStats } from '@/services/databaseService';
import { Jadwal, JadwalPengganti } from '@/types/database';
import { useDashboard } from '@/hooks/useDashboard';
import { Skeleton } from './ui/skeleton';
import { useScheduleData } from '@/hooks/useScheduleData';
import React from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface DashboardClientProps {
  initialStats: DashboardStats;
  initialJadwal: Jadwal[];
  initialPengganti: JadwalPengganti[];
  initialTerms: string[];
  activeModul: number;
  userRole?: string;
  initialMonitoringData: any[];
}

export default function DashboardClient({
  initialStats,
  initialJadwal,
  initialPengganti,
  initialTerms,
  activeModul,
  userRole,
  initialMonitoringData,
}: DashboardClientProps) {
  const { terms, selectedTerm, stats, rawJadwal, jadwalPengganti, loading } =
    useDashboard(initialTerms, initialStats, initialJadwal, initialPengganti, activeModul);

  // Derive today's day name (WIB)
  const todayDate = new Date();
  const currentDayNameRaw = format(todayDate, 'EEEE', { locale: id }).toUpperCase();
  const validDays = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'];
  const currentDayName = validDays.includes(currentDayNameRaw) ? currentDayNameRaw : 'SENIN';

  // Build "today's effective schedule" using the same hook as JadwalClientPage
  // Filter to today's day, apply pengganti overlay, then count unique visible classes
  const { processedJadwalList } = useScheduleData({
    rawJadwalList: rawJadwal,
    jadwalPengganti: jadwalPengganti,
    selectedModul: `Modul ${activeModul}`,
    filterDay: currentDayName,
  });

  return (
    <>
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl 2xl:text-3xl font-bold tracking-tight">Ringkasan</h1>
          <p className="text-sm 2xl:text-base text-muted-foreground mt-1">
            Selamat datang di portal admin Manajemen Asisten Praktikum
          </p>
        </div>
        <div>
          {loading && terms.length === 0 ? (
            <Skeleton className="h-10 w-[180px]" />
          ) : (
            <div className="h-10"></div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 2xl:gap-8 mb-6">
        <StatCard
          title="Total Asprak"
          value={stats.asprakCount}
          subtitle="Terdaftar pada term ini"
          icon={Users}
          trend="Aktif"
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Total Jadwal"
          value={stats.jadwalCount}
          subtitle="Kelas terjadwal"
          icon={BookOpen}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Pelanggaran"
          value={stats.pelanggaranCount}
          subtitle="Total tercatat"
          icon={AlertTriangle}
          trend="Perlu tinjauan"
          color="red"
          loading={loading}
        />

        <StatCard
          title="Jadwal Hari Ini"
          value={processedJadwalList.length}
          subtitle="Sesi hari ini"
          icon={Calendar}
          color="green"
          loading={loading}
        />
      </div>

      <RealtimeMonitoringWidget initialData={initialMonitoringData} />

      <div className="mb-12">
        <DashboardCharts
          asprakByAngkatan={stats.asprakByAngkatan}
          jadwalByDay={stats.jadwalByDay}
          rawJadwal={rawJadwal}
          jadwalPengganti={jadwalPengganti}
          loading={loading}
          term={selectedTerm}
          activeModul={activeModul}
          userRole={userRole}
        />
      </div>
    </>
  );
}
