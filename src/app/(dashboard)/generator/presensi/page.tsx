'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRESENSI_THEMES } from '@/constants/presensiConstants';
import { generatePresensiExcel } from '@/services/presensiGenerator';
import { usePresensi } from '@/hooks/usePresensi';
import { PraktikumSelector } from '@/components/presensi/PraktikumSelector';
import { KelasManager } from '@/components/presensi/KelasManager';
import { OptionsToggles } from '@/components/presensi/OptionsToggles';
import { ThemeKey } from '@/types/presensi';

export default function PresensiPage() {
  const state = usePresensi();
  const data = state;

  const handleGenerate = async () => {
    if (!state.selectedPraktikumId || state.kelasNames.length === 0) {
      toast.error('Silakan pilih Praktikum terlebih dahulu');
      return;
    }
    if (!state.isWeightValid) {
      toast.error('Total bobot nilai harus 100%');
      return;
    }

    try {
      await generatePresensiExcel({
        namaFile: state.namaFile,
        kelasNames: state.kelasNames,
        jumlahModul: state.jumlahModul,
        kelasSettings: state.kelasSettings,
        opsi: state.opsi,
        asprakList: data.asprakList,
        generateRekapSheet: state.generateRekapSheet,
        theme: state.theme,
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
              praktikumList={data.praktikumList}
              selectedPraktikumId={state.selectedPraktikumId}
              setSelectedPraktikumId={state.setSelectedPraktikumId}
              loadingPraktikum={data.loadingPraktikum}
              availableJurusans={data.availableJurusans}
              selectedJurusan={state.selectedJurusan}
              setSelectedJurusan={state.setSelectedJurusan}
            />

            <KelasManager
              loadingKelas={data.loadingKelas}
              kelasNames={state.kelasNames}
              handleRemoveKelas={state.handleRemoveKelas}
              customKelasInput={state.customKelasInput}
              setCustomKelasInput={state.setCustomKelasInput}
              handleAddCustomKelas={state.handleAddCustomKelas}
            />

            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="namaFile">Nama File (tanpa .xlsx)</Label>
              <Input
                id="namaFile"
                value={state.namaFile}
                onChange={(e) => state.setNamaFile(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jumlahModul">Jumlah Modul</Label>
              <Input
                id="jumlahModul"
                type="number"
                min={1}
                value={state.jumlahModul}
                onChange={(e) => state.setJumlahModul(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tema Warna Excel</Label>
              <Select value={state.theme} onValueChange={(val) => state.setTheme(val as ThemeKey)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Tema" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRESENSI_THEMES).map(([key, themeObj]) => (
                    <SelectItem key={key} value={key}>
                      {themeObj.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Tanggal Modul 1</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !state.globalTanggalMulai && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {state.globalTanggalMulai
                      ? format(state.globalTanggalMulai, 'PPP')
                      : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={state.globalTanggalMulai}
                    onSelect={(date) => state.setGlobalTanggalMulai(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="globalJumlahPraktikan">Default Praktikan</Label>
              <Input
                id="globalJumlahPraktikan"
                type="number"
                min={1}
                value={state.globalJumlahPraktikan}
                onChange={(e) => state.setGlobalJumlahPraktikan(Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="globalJumlahAsprak">Default Asprak</Label>
              <Input
                id="globalJumlahAsprak"
                type="number"
                min={1}
                value={state.globalJumlahAsprak}
                onChange={(e) => state.setGlobalJumlahAsprak(Number(e.target.value))}
              />
            </div>
            
            <div className="sm:col-span-2 flex justify-end">
              <Button variant="secondary" onClick={state.applyGlobalToAll} disabled={state.kelasNames.length === 0}>
                Terapkan Default ke Semua Kelas
              </Button>
            </div>
          </CardContent>
        </Card>

        {state.kelasNames.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan per Kelas</CardTitle>
              <CardDescription>Atur tanggal, jumlah praktikan, dan jumlah asprak spesifik tiap kelas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.kelasNames.map((kelasName, i) => (
                <div key={kelasName} className="flex flex-col md:flex-row gap-4 items-end border p-4 rounded-md bg-muted/20">
                  <div className="w-full md:w-1/3 flex flex-col space-y-2">
                    <Label>Tanggal Modul 1 ({kelasName})</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !state.kelasSettings[i]?.tanggalMulai && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {state.kelasSettings[i]?.tanggalMulai
                            ? format(state.kelasSettings[i].tanggalMulai, 'PPP')
                            : <span>Pilih tanggal</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={state.kelasSettings[i]?.tanggalMulai}
                          onSelect={(date) => state.updateKelasSetting(i, 'tanggalMulai', date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="w-full md:w-1/3 flex flex-col space-y-2">
                    <Label>Jumlah Praktikan</Label>
                    <Input
                      type="number"
                      min={1}
                      value={state.kelasSettings[i]?.jumlahPraktikan || 0}
                      onChange={(e) => state.updateKelasSetting(i, 'jumlahPraktikan', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="w-full md:w-1/3 flex flex-col space-y-2">
                    <Label>Jumlah Asprak</Label>
                    <Input
                      type="number"
                      min={1}
                      value={state.kelasSettings[i]?.jumlahAsprak || 0}
                      onChange={(e) => state.updateKelasSetting(i, 'jumlahAsprak', Number(e.target.value))}
                    />
                  </div>
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
            <OptionsToggles 
              opsi={state.opsi} 
              setOpsi={state.setOpsi} 
              generateRekapSheet={state.generateRekapSheet}
              onToggleRekapSheet={state.setGenerateRekapSheet}
              asprakCount={data.asprakList.length}
              loadingAsprak={data.loadingAsprak}
              hasPraktikum={!!state.selectedPraktikumId}
            />
            {!state.isWeightValid && state.totalWeight > 0 && (
              <p className="text-sm text-destructive mt-4">
                Total bobot saat ini: {state.totalWeight}%. Total bobot harus tepat 100%.
              </p>
            )}
          </CardContent>
          <CardFooter className="bg-muted/50 flex justify-end p-4 border-t">
            <Button size="lg" onClick={handleGenerate} disabled={state.kelasNames.length === 0 || (!state.isWeightValid && state.totalWeight > 0)}>
              Generate File Excel
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
