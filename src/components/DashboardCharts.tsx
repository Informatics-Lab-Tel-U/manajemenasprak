'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useScheduleData } from '@/hooks/useScheduleData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Jadwal } from '@/types/database';
import { ROOMS } from '@/constants';
import { ScheduleCell } from '@/components/jadwal/ScheduleCell';
import React, { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useJaga } from '@/hooks/useJaga';
import { getJagaShiftsByDay } from '@/utils/jagaUtils';

export default function DashboardCharts({
  asprakByAngkatan,
  jadwalByDay,
  todaySchedule,
  loading,
  term,
  userRole,
}: {
  asprakByAngkatan: { name: string; count: number }[];
  jadwalByDay: { name: string; count: number }[];
  todaySchedule: Jadwal[];
  loading: boolean;
  term: string;
  userRole?: string;
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

  const uniqueRooms = useMemo(() => {
    // We can use the global ROOMS constant or derive from today's schedule
    // Using global ROOMS ensures the grid structure is consistent
    return ROOMS;
  }, []);

  // Filter Logic
  const [programType, setProgramType] = React.useState<'REGULER' | 'PJJ'>('REGULER');
  // Calculate currentDayName if not already present (it should be 'SENIN'-'MINGGU')
  const currentDayNameRaw = format(todayDate, 'EEEE', { locale: id }).toUpperCase();
  const currentDayName =
    currentDayNameRaw === 'SENIN' ||
    currentDayNameRaw === 'SELASA' ||
    currentDayNameRaw === 'RABU' ||
    currentDayNameRaw === 'KAMIS' ||
    currentDayNameRaw === 'JUMAT' ||
    currentDayNameRaw === 'SABTU' ||
    currentDayNameRaw === 'MINGGU'
      ? currentDayNameRaw
      : 'SENIN';

  // Use the unified useScheduleData hook for today's schedule
  const {
    processedJadwalList,
    scheduleMatrix: fullMatrix,
    dynamicSessionsByDay,
  } = useScheduleData({
    rawJadwalList: todaySchedule,
    filterDay: currentDayName,
    programType,
  });

  // Extract today's matrix and sessions from the hook results
  const scheduleMatrix = fullMatrix[currentDayName] || {};
  const visibleSessions = dynamicSessionsByDay[currentDayName] || [];

  const { jagaList } = useJaga(term, 0, currentDayName);
  const shiftInfos = getJagaShiftsByDay(currentDayName);

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Schedule Visualization */}
      <Card className="col-span-full border-border/50 shadow-sm bg-card flex flex-col">
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
        <CardContent className="p-6">
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
          ) : processedJadwalList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
              <p>Tidak ada jadwal praktikum untuk hari ini.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border shadow-sm bg-card/50">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="p-2 border-r-0 text-center font-bold min-w-[120px] text-xs uppercase text-muted-foreground bg-transparent">
                        Penjagaan
                      </th>
                      <th className="w-4 bg-transparent border-none"></th>
                      <th className="p-2 border-r border-l border-border text-center font-bold min-w-[60px] text-xs uppercase text-muted-foreground">
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
                    {visibleSessions.map((session) => {
                      const matchedShift = shiftInfos.find(s => s.shift === session.sesi) || shiftInfos[(session.sesi || 1) - 1];
                      const shiftJaga = jagaList.filter(j => j.shift?.toString() === matchedShift?.shift?.toString());

                      return (
                      <tr
                        key={session.rowKey}
                        className="hover:bg-muted/30 transition-colors border-b border-border/50"
                      >
                        <td className="p-2 border-r-0 text-center align-top relative bg-muted/5">
                           <div className="flex flex-wrap gap-1 justify-center max-w-[120px] mx-auto min-h-[40px] items-center">
                           {shiftJaga.length > 0 ? (
                              shiftJaga.map(j => (
                                <div 
                                  key={j.id} 
                                  className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${
                                    j.asprak?.role === 'ASLAB' 
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800/50' 
                                      : 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                  }`}
                                  title={`${j.asprak?.nama_lengkap} (${j.asprak?.nim})`}
                                >
                                  {j.asprak?.kode || 'Unknown'}
                                </div>
                              ))
                           ) : (
                              <span className="text-[10px] text-muted-foreground italic">-</span>
                           )}
                           </div>
                        </td>
                        <td className="w-4 bg-transparent border-none"></td>
                        <td className="p-2 border-r border-l border-border text-center font-medium text-muted-foreground text-xs">
                          {session.sesi ? (
                            <div className="font-bold">Sesi {session.sesi}</div>
                          ) : null}
                          <div className="text-[10px] opacity-80">{session.jam}</div>
                        </td>
                        {uniqueRooms.map((room) => {
                          const jadwals = scheduleMatrix[session.rowKey]?.[room] || [];
                          return (
                            <td
                              key={`${session.rowKey}-${room}`}
                              className="p-0 border-r border-border h-[60px] w-[120px] relative align-top"
                            >
                              <div className="flex flex-col w-full h-full min-h-[60px]">
                                {jadwals.map((jadwal, idx) => (
                                  <ScheduleCell
                                    key={jadwal.id || idx}
                                    jadwal={jadwal}
                                    showAsprakCount={true}
                                  />
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
              {/* Legend */}
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-4 h-4 bg-muted rounded-[2px]"
                    style={{
                      background: `linear-gradient(var(--muted), var(--muted)) padding-box, repeating-linear-gradient(45deg, #facc15, #facc15 5px, #ffffff 5px, #ffffff 10px) border-box`,
                      border: '3px solid transparent',
                    }}
                  ></div>
                  <span>Jadwal Pengganti</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-sm bg-muted border border-border"></div>
                  <span>Jadwal Reguler</span>
                </div>
              </div>
            </>
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
