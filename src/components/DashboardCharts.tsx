'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Jadwal } from '@/types/database';
import { ROOMS, STATIC_SESSIONS } from '@/constants';
import { getCourseColor } from '@/utils/colorUtils';
import React, { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardCharts({
  asprakByAngkatan,
  jadwalByDay,
  todaySchedule,
  selectedTerm,
  loading,
}: {
  asprakByAngkatan: { name: string; count: number }[];
  jadwalByDay: { name: string; count: number }[];
  todaySchedule: Jadwal[];
  selectedTerm: string;
  loading: boolean;
}) {
  const dataAsprak = [...asprakByAngkatan].sort((a, b) => parseInt(a.name) - parseInt(b.name));

  const dayOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const dataJadwal = [...jadwalByDay].sort(
    (a, b) => dayOrder.indexOf(a.name) - dayOrder.indexOf(b.name)
  );

  const chartConfigAsprak = {
    count: {
      label: 'Jumlah Asprak',
      color: 'var(--primary)',
    },
  } satisfies ChartConfig;

  const chartConfigJadwal = {
    count: {
      label: 'Total Kelas',
      color: 'var(--primary)',
    },
  } satisfies ChartConfig;

  // Schedule Matrix Logic
  const todayDate = new Date();
  const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  const currentDayName = days[todayDate.getDay()];

  const uniqueRooms = useMemo(() => {
    // We can use the global ROOMS constant or derive from today's schedule
    // Using global ROOMS ensures the grid structure is consistent
    return ROOMS;
  }, []);

  // Filter Logic
  const [programType, setProgramType] = React.useState<'REGULER' | 'PJJ'>('REGULER');

  const filteredSchedule = useMemo(() => {
    return todaySchedule.filter((j) => {
      const isPJJ =
        j.mata_kuliah?.program_studi?.toUpperCase().includes('PJJ') ||
        j.kelas?.toUpperCase().includes('PJJ');

      if (programType === 'PJJ') {
        return isPJJ;
      } else {
        return !isPJJ;
      }
    });
  }, [todaySchedule, programType]);

  const scheduleMatrix = useMemo(() => {
    const matrix: Record<number, Record<string, Jadwal>> = {};
    filteredSchedule.forEach((j) => {
      if (!j.sesi || !j.ruangan) return;
      if (!matrix[j.sesi]) matrix[j.sesi] = {};
      matrix[j.sesi][j.ruangan] = j;
    });
    return matrix;
  }, [filteredSchedule]);

  const allSessions = STATIC_SESSIONS[currentDayName] || [];
  const visibleSessions = useMemo(() => {
    if (allSessions.length === 0) return allSessions;
    const lastSession = allSessions[allSessions.length - 1];
    const hasLastSessionSchedule = scheduleMatrix[lastSession.sesi] !== undefined;
    return hasLastSessionSchedule ? allSessions : allSessions.slice(0, -1);
  }, [allSessions, scheduleMatrix]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Schedule Visualization */}
      <Card className="col-span-full border-border/50 shadow-sm bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              Jadwal Hari Ini ({todayDate.toLocaleDateString('id-ID', { weekday: 'long' })})
            </CardTitle>
            <CardDescription>
              Visualisasi jadwal praktikum yang berlangsung hari ini
            </CardDescription>
          </div>
          <div className="bg-muted/50 p-1 rounded-lg flex items-center gap-1 border border-border/50">
            <button
              onClick={() => setProgramType('REGULER')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                programType === 'REGULER'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              }`}
            >
              Reguler
            </button>
            <button
              onClick={() => setProgramType('PJJ')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                programType === 'PJJ'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              }`}
            >
              PJJ
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-lg border border-border bg-card/50">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="p-2 border-r border-border min-w-[60px]">
                        <Skeleton className="h-4 w-8 mx-auto" />
                      </th>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <th key={i} className="p-2 border-r border-border min-w-[120px]">
                          <Skeleton className="h-4 w-16 mx-auto" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50 h-[60px]">
                        <td className="p-2 border-r border-border text-center">
                          <div className="space-y-1">
                            <Skeleton className="h-3 w-8 mx-auto" />
                            <Skeleton className="h-2 w-10 mx-auto" />
                          </div>
                        </td>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <td key={j} className="p-2 border-r border-border align-middle">
                            {i % 2 === 0 && j % 2 === 0 && <Skeleton className="h-10 w-full" />}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : filteredSchedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
              <p>Tidak ada jadwal praktikum untuk hari ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border shadow-sm bg-card/50">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-2 border-r border-border text-center font-bold min-w-[60px] text-xs uppercase text-muted-foreground">
                      Sesi
                    </th>
                    {uniqueRooms.map((room) => (
                      <th
                        key={room}
                        className="p-2 border-r border-border text-center font-bold min-w-[120px] whitespace-nowrap text-xs"
                      >
                        {room}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleSessions.map((session, sessionIndex) => (
                    <tr
                      key={session.sesi ?? sessionIndex + 1}
                      className="hover:bg-muted/30 transition-colors border-b border-border/50"
                    >
                      <td className="p-2 border-r border-border text-center font-medium text-muted-foreground text-xs">
                        <div className="font-bold">Sesi {session.sesi ?? sessionIndex + 1}</div>
                        <div className="text-[10px] opacity-80">{session.jam}</div>
                      </td>
                      {uniqueRooms.map((room) => {
                        const jadwal = scheduleMatrix[session.sesi ?? sessionIndex + 1]?.[room];
                        return (
                          <td
                            key={`${session.sesi ?? sessionIndex + 1}-${room}`}
                            className="p-0 border-r border-border h-[60px] w-[120px] relative"
                          >
                            {jadwal ? (
                              <div
                                className="w-full h-full flex flex-col items-center justify-center p-1 transition-all hover:brightness-110 overflow-hidden hover:scale-105 hover:z-10 hover:shadow-lg origin-center"
                                style={{
                                  backgroundColor:
                                    jadwal.mata_kuliah?.warna ||
                                    getCourseColor(jadwal.mata_kuliah?.nama_lengkap || ''),
                                }}
                                title={`${jadwal.mata_kuliah?.nama_lengkap} - ${jadwal.kelas}`}
                              >
                                <div className="text-center leading-tight">
                                  <div className="font-bold text-[10px] sm:text-xs text-white drop-shadow-md truncate w-full px-1">
                                    {jadwal.mata_kuliah?.praktikum?.nama ||
                                      jadwal.mata_kuliah?.nama_lengkap ||
                                      'Unknown'}
                                  </div>
                                  <div className="text-[9px] sm:text-[10px] text-white/90">
                                    {jadwal.kelas}
                                  </div>
                                  <div className="text-[8px] sm:text-[9px] text-white/80 truncate px-1">
                                    {(jadwal.dosen || '-').split(' ')[0]}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Chart 1: Asprak per Angkatan */}
      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader>
          <CardTitle>Total Asprak per Angkatan</CardTitle>
          <CardDescription>Distribusi asisten praktikum berdasarkan angkatan</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] w-full flex items-end gap-2 pb-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="flex-1"
                  style={{ height: `${20 + ((i * 17) % 60)}%` }}
                />
              ))}
            </div>
          ) : (
            <ChartContainer config={chartConfigAsprak} className="h-[300px] w-full">
              <BarChart data={dataAsprak} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: Jadwal per Hari */}
      <Card className="border-border/50 shadow-sm bg-card">
        <CardHeader>
          <CardTitle>Distribusi Jadwal per Hari</CardTitle>
          <CardDescription>Jumlah kelas praktikum per hari dalam seminggu</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] w-full flex items-end gap-2 pb-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="flex-1"
                  style={{ height: `${30 + ((i * 10) % 50)}%` }}
                />
              ))}
            </div>
          ) : (
            <ChartContainer config={chartConfigJadwal} className="h-[300px] w-full">
              <BarChart data={dataJadwal} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
