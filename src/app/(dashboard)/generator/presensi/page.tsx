'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generatePresensiExcel } from '@/services/presensiGenerator';
import { usePresensiForm } from '@/hooks/usePresensiForm';
import { PraktikumSelector } from '@/components/presensi/PraktikumSelector';
import { KelasManager } from '@/components/presensi/KelasManager';
import { OptionsToggles } from '@/components/presensi/OptionsToggles';

export default function PresensiPage() {
  const { state, setters, handlers } = usePresensiForm();

  const handleGenerate = async () => {
    if (!state.selectedPraktikumId || state.kelasNames.length === 0) {
      toast.error('Silakan pilih Praktikum terlebih dahulu');
      return;
    }

    try {
      // Ensure tanggalMulai has enough dates, fallback to today
      const dates = Array.from({ length: state.kelasNames.length }).map(
        (_, i) => state.tanggalMulai[i] || new Date()
      );

      await generatePresensiExcel({
        namaFile: state.namaFile,
        kelasNames: state.kelasNames,
        jumlahModul: state.jumlahModul,
        tanggalMulai: dates,
        opsi: state.opsi,
      });
      toast.success('File excel berhasil di-generate dan diunduh!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Gagal men-generate file presensi.');
    }
  };

  return (
    <div className="container mx-auto max-w-[2000px] 2xl:px-8 relative">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl 2xl:text-3xl font-bold tracking-tight">Generator Presensi</h1>
            <p className="text-sm 2xl:text-base text-muted-foreground mt-1">
              Buat template absensi asisten praktikum dalam format Excel secara otomatis.
            </p>
          </div>
        </div>
      </header>

      <div className="w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Opsi File</CardTitle>
            <CardDescription>Pilih Praktikum dan atur file keluaran</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <PraktikumSelector
              praktikumList={state.praktikumList}
              selectedPraktikumId={state.selectedPraktikumId}
              setSelectedPraktikumId={setters.setSelectedPraktikumId}
              loadingPraktikum={state.loadingPraktikum}
              availableJurusans={state.availableJurusans}
              selectedJurusan={state.selectedJurusan}
              setSelectedJurusan={setters.setSelectedJurusan}
            />

            <KelasManager
              loadingKelas={state.loadingKelas}
              kelasNames={state.kelasNames}
              handleRemoveKelas={handlers.handleRemoveKelas}
              customKelasInput={state.customKelasInput}
              setCustomKelasInput={setters.setCustomKelasInput}
              handleAddCustomKelas={handlers.handleAddCustomKelas}
            />

            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="namaFile">Nama File (tanpa .xlsx)</Label>
              <Input
                id="namaFile"
                value={state.namaFile}
                onChange={(e) => setters.setNamaFile(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jumlahModul">Jumlah Modul</Label>
              <Input
                id="jumlahModul"
                type="number"
                min={1}
                value={state.jumlahModul}
                onChange={(e) => setters.setJumlahModul(Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {state.kelasNames.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tanggal Mulai per Kelas</CardTitle>
              <CardDescription>Atur tanggal awal untuk modul 1 di setiap kelas</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {state.kelasNames.map((kelasName, i) => (
                <div key={kelasName} className="flex flex-col space-y-2">
                  <Label>Tanggal Kelas {kelasName}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !state.tanggalMulai[i] && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {state.tanggalMulai[i]
                          ? format(state.tanggalMulai[i], 'PPP')
                          : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={state.tanggalMulai[i]}
                        onSelect={(date) => handlers.setTanggal(i, date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Kolom Penilaian Opsional</CardTitle>
            <CardDescription>
              Pilih komponen nilai apa saja yang akan ada di setiap modul
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OptionsToggles opsi={state.opsi} setOpsi={setters.setOpsi} />
          </CardContent>
          <CardFooter className="bg-muted/50 flex justify-end p-4 border-t">
            <Button size="lg" onClick={handleGenerate} disabled={state.kelasNames.length === 0}>
              Generate File Excel
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
