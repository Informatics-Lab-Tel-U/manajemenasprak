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

  // Calculate total weight (only for 'number' input types)
  const totalWeight =
    (state.opsi.tp.enabled && state.opsi.tp.inputType === 'number' ? state.opsi.tp.weight : 0) +
    (state.opsi.jurnal.enabled && state.opsi.jurnal.inputType === 'number' ? state.opsi.jurnal.weight : 0) +
    (state.opsi.tesAkhir.enabled && state.opsi.tesAkhir.inputType === 'number' ? state.opsi.tesAkhir.weight : 0);

  const isWeightValid = totalWeight === 100 || totalWeight === 0; // 0 is valid if nothing is checked or all are YA/TIDAK

  const handleGenerate = async () => {
    if (!state.selectedPraktikumId || state.kelasNames.length === 0) {
      toast.error('Silakan pilih Praktikum terlebih dahulu');
      return;
    }
    if (!isWeightValid) {
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
        asprakList: state.asprakList,
        generateRekapSheet: state.generateRekapSheet,
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

            <div className="space-y-2">
              <Label htmlFor="globalJumlahPraktikan">Default Praktikan</Label>
              <Input
                id="globalJumlahPraktikan"
                type="number"
                min={1}
                value={state.globalJumlahPraktikan}
                onChange={(e) => setters.setGlobalJumlahPraktikan(Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="globalJumlahAsprak">Default Asprak</Label>
              <Input
                id="globalJumlahAsprak"
                type="number"
                min={1}
                value={state.globalJumlahAsprak}
                onChange={(e) => setters.setGlobalJumlahAsprak(Number(e.target.value))}
              />
            </div>
            
            <div className="sm:col-span-2 flex justify-end">
              <Button variant="secondary" onClick={handlers.applyGlobalToAll} disabled={state.kelasNames.length === 0}>
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
                    <Label>Kelas {kelasName}</Label>
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
                          onSelect={(date) => handlers.updateKelasSetting(i, 'tanggalMulai', date)}
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
                      onChange={(e) => handlers.updateKelasSetting(i, 'jumlahPraktikan', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="w-full md:w-1/3 flex flex-col space-y-2">
                    <Label>Jumlah Asprak</Label>
                    <Input
                      type="number"
                      min={1}
                      value={state.kelasSettings[i]?.jumlahAsprak || 0}
                      onChange={(e) => handlers.updateKelasSetting(i, 'jumlahAsprak', Number(e.target.value))}
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
              setOpsi={setters.setOpsi} 
              generateRekapSheet={state.generateRekapSheet}
              onToggleRekapSheet={setters.setGenerateRekapSheet}
              asprakCount={state.asprakList.length}
              loadingAsprak={state.loadingAsprak}
              hasPraktikum={!!state.selectedPraktikumId}
            />
            {!isWeightValid && totalWeight > 0 && (
              <p className="text-sm text-destructive mt-4">
                Total bobot saat ini: {totalWeight}%. Total bobot harus tepat 100%.
              </p>
            )}
          </CardContent>
          <CardFooter className="bg-muted/50 flex justify-end p-4 border-t">
            <Button size="lg" onClick={handleGenerate} disabled={state.kelasNames.length === 0 || (!isWeightValid && totalWeight > 0)}>
              Generate File Excel
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
