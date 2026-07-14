import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, BookOpen, Users, ArrowRight } from 'lucide-react';

export default function OnboardHubPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Setup Sistem</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Pilih modul onboarding yang ingin Anda konfigurasi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Card 1: Tahun Ajaran & Praktikum */}
        <Card className="flex flex-col hover:border-primary/50 transition-colors shadow-sm hover:shadow-md">
          <CardHeader>
            <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Tahun Ajaran & Praktikum</CardTitle>
            <CardDescription>
              Inisialisasi tahun ajaran baru, daftar praktikum, dan referensi mata kuliah.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Buat Tahun Ajaran</li>
              <li>Impor Data Praktikum</li>
              <li>Impor Data Mata Kuliah</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full gap-2">
              <Link href="/onboard/tahun-ajaran-baru">
                Mulai Setup <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Card 2: Jadwal Praktikum */}
        <Card className="flex flex-col hover:border-primary/50 transition-colors shadow-sm hover:shadow-md">
          <CardHeader>
            <div className="bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <CardTitle>Jadwal Praktikum</CardTitle>
            <CardDescription>
              Konfigurasi shift, tanggal modul, dan plotting jadwal asisten.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Setup Shift Harian</li>
              <li>Tanggal Mulai Modul</li>
              <li>Generate Plotting Jadwal</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full gap-2 group hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/50">
              <Link href="/onboard/jadwal">
                Mulai Setup <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Card 3: Data Asprak */}
        <Card className="flex flex-col hover:border-primary/50 transition-colors shadow-sm hover:shadow-md">
          <CardHeader>
            <div className="bg-orange-500/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-orange-500" />
            </div>
            <CardTitle>Data Asprak</CardTitle>
            <CardDescription>
              Kelola data asisten praktikum, generate kode asprak, dan plotting.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Impor Data Asprak</li>
              <li>Atur Role & Akses</li>
              <li>Distribusi Kode Akses</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full gap-2 group hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 dark:hover:bg-orange-950/50">
              <Link href="/onboard/asprak">
                Mulai Setup <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
