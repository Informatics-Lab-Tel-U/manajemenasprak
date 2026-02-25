'use client';

import { useState, useEffect } from 'react';
import { Users, BookOpen, AlertTriangle, Calendar } from 'lucide-react';
import DashboardCharts from '@/components/DashboardCharts';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/badge';
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
import { Button } from './ui/button';
import { Card, CardHeader, CardContent } from './ui/card';

interface DashboardClientProps {
  initialStats: DashboardStats;
  initialSchedule: Jadwal[];
  initialTerms: string[];
}

export default function DashboardClient({
  initialStats,
  initialSchedule,
  initialTerms,
}: DashboardClientProps) {
  const { terms, selectedTerm, setSelectedTerm, stats, todaySchedule, loading, error } =
    useDashboard(initialTerms, initialStats, initialSchedule);

  return (
    <>
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="title-gradient text-4xl font-bold">Overview</h1>
          <p className="text-muted-foreground mt-1">
            Selamat datang di portal admin Manajemen Asisten Praktikum
          </p>
        </div>
        <div>
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih Term" />
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
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Asprak"
          value={loading ? '...' : stats.asprakCount}
          subtitle="Registered in system"
          icon={Users}
          trend="Active"
          color="purple"
        />
        <StatCard
          title="Total Jadwal"
          value={loading ? '...' : stats.jadwalCount}
          subtitle="Classes scheduled"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Pelanggaran"
          value={loading ? '...' : stats.pelanggaranCount}
          subtitle="Total recorded"
          icon={AlertTriangle}
          trend="Needs review"
          color="red"
        />

        <StatCard
          title="Jadwal Hari Ini"
          value={todaySchedule.length}
          subtitle="Sessions today"
          icon={Calendar}
          color="green"
        />
      </div>

      <div className="mb-12">
        <DashboardCharts
          asprakByAngkatan={stats.asprakByAngkatan}
          jadwalByDay={stats.jadwalByDay}
          todaySchedule={todaySchedule}
          selectedTerm={selectedTerm}
        />
      </div>
    </>
  );
}
