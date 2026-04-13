'use client';

import { Users, BookOpen, AlertTriangle, Calendar } from 'lucide-react';
import DashboardCharts from '@/components/DashboardCharts';
import { StatCard } from '@/components/ui/StatCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SelectGroup } from '@radix-ui/react-select';
import type { DashboardStats } from '@/services/databaseService';
import { Jadwal } from '@/types/database';
import { useDashboard } from '@/hooks/useDashboard';
import { Skeleton } from './ui/skeleton';

interface DashboardClientProps {
  initialStats: DashboardStats;
  initialSchedule: Jadwal[];
  initialTerms: string[];
  activeModul: number;
  userRole?: string;
}

export default function DashboardClient({
  initialStats,
  initialSchedule,
  initialTerms,
  activeModul,
  userRole,
}: DashboardClientProps) {
  const { terms, selectedTerm, setSelectedTerm, stats, todaySchedule, loading } = useDashboard(
    initialTerms,
    initialStats,
    initialSchedule
  );

  return (
    <>
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ringkasan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selamat datang di portal admin Manajemen Asisten Praktikum
          </p>
        </div>
        <div>
          {loading && terms.length === 0 ? (
            <Skeleton className="h-10 w-[180px]" />
          ) : (
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih Angkatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Angkatan</SelectLabel>
                  {terms.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
          value={todaySchedule.length}
          subtitle="Sesi hari ini"
          icon={Calendar}
          color="green"
          loading={loading}
        />
      </div>

      <div className="mb-12">
        <DashboardCharts
          asprakByAngkatan={stats.asprakByAngkatan}
          jadwalByDay={stats.jadwalByDay}
          todaySchedule={todaySchedule}
          loading={loading}
          term={selectedTerm}
          activeModul={activeModul}
          userRole={userRole}
        />
      </div>
    </>
  );
}
