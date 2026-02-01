'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Chart 1: Asprak per Angkatan */}
      <Card>
        <CardHeader>
          <CardTitle>Total Asprak per Angkatan</CardTitle>
          <CardDescription>Distribusi asisten praktikum berdasarkan angkatan</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfigAsprak} className="h-[300px] w-full">
            <BarChart data={dataAsprak} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickMargin={10} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Chart 2: Jadwal per Hari */}
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Jadwal per Hari</CardTitle>
          <CardDescription>Jumlah kelas praktikum per hari dalam seminggu</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfigJadwal} className="h-[300px] w-full">
            <BarChart data={dataJadwal} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickMargin={10} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Placeholder for Jadwal Pengganti Analysis */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Analisis Jadwal Pengganti</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Belum ada data jadwal pengganti yang tercatat tahun ini.
          </p>
          <div className="mt-4 flex gap-8">
            <div>
              <span className="block text-sm text-muted-foreground">Total Pengganti (YTD)</span>
              <span className="text-2xl font-bold">0</span>
            </div>
            <div>
              <span className="block text-sm text-muted-foreground">Ratio vs Reguler</span>
              <span className="text-2xl font-bold">0%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
