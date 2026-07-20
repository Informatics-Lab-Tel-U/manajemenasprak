import { Suspense } from 'react';
import { LightWavesBackground } from '@/components/login/LightWavesBackground';
import { LoginForm } from '@/components/login/LoginForm';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import packageInfo from '../../../../package.json';

export default function Page() {
  return (
    <div className="relative flex flex-col md:flex-row min-h-svh w-full ">
      {/* Left panel (Branding) */}
      <div className="w-full md:w-[52%] lg:w-[60%] flex-1 md:h-dvh relative min-h-[280px] md:min-h-0 flex flex-col">
        <div className="absolute inset-0 z-0">
          <LightWavesBackground />
        </div>

        {/* Informatics Laboratory Title */}
        <div className="relative md:absolute md:top-0 md:left-0 z-20 w-full">
          <div className="max-w-4xl w-full mx-auto px-4 md:px-8 pt-6 md:pt-8 pb-2">
            <h2 className="text-xl md:text-2xl font-semibold">
              Informatics Laboratory
            </h2>
          </div>
        </div>

        <div className="relative z-10 flex flex-col flex-1 max-w-4xl w-full mx-auto justify-center px-4 py-6 md:px-8 md:pb-8">
          <Card className="glass shadow-2xl overflow-hidden border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="relative size-16 md:size-20 lg:size-24 shrink-0">
                  <Image
                    src="/iflab.png"
                    alt="Informatics Laboratory"
                    fill
                    sizes="(max-width: 768px) 64px, (max-width: 1024px) 80px, 96px"
                    priority
                    className="object-contain drop-shadow-md"
                  />
                </div>
                <div>
                  <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">
                    Manajemen
                    <br className="hidden sm:block" /> Asisten Praktikum
                  </CardTitle>
                </div>
              </div>
            </CardHeader>

            <Separator className="bg-border/50" />

            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm md:text-base">
              {/* Bahasa Indonesia */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold text-lg">
                  <span className="text-xl">🇮🇩</span> Bahasa
                </div>
                <ul className="space-y-3 text-muted-foreground list-disc pl-5">
                  <li>
                    Akses dibatasi hanya untuk <span className="font-medium text-foreground">Asisten Laboratorium, Asisten Praktikum Koordinator, dan Laboran</span> Laboratorium Informatika.
                  </li>
                  <li>
                    Silakan masuk menggunakan kredensial yang telah terdaftar pada sistem Manajemen Asisten Praktikum.
                  </li>
                  <li>
                    Bila Anda mengalami kendala saat masuk, silakan hubungi administrator laboratorium.
                  </li>
                </ul>
              </div>

              {/* English */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-semibold text-lg">
                  <span className="text-xl">🇬🇧</span> English
                </div>
                <ul className="space-y-3 text-muted-foreground list-disc pl-5">
                  <li>
                    Access is restricted only to <span className="font-medium text-foreground">Laboratory Assistants, Practicum Assistant Coordinators, and Laboratory Technicians</span> of Informatics Laboratory.
                  </li>
                  <li>
                    Please log in using the credentials registered in the Practicum Assistant Management system.
                  </li>
                  <li>
                    If you experience login issues, please contact the laboratory administrator.
                  </li>
                </ul>
              </div>
            </CardContent>

            <Separator className="bg-border/50" />

            <CardFooter className="bg-muted/30 py-4 flex flex-col items-center justify-center text-center gap-2">
              <p className="text-sm font-medium">Informasi lebih lanjut dapat menghubungi:</p>
              <div className="text-sm text-muted-foreground font-medium flex flex-col xl:flex-row gap-2 xl:gap-6">
                <span>Instagram: @informaticslab_telu</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Right panel (Form) */}
      <div className="w-full md:w-[48%] lg:w-[40%] shrink-0 bg-background flex flex-col justify-center items-center py-8 z-10 rounded-t-3xl md:rounded-none md:h-dvh shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none">
        <div className="p-6 w-full max-w-md lg:w-[80%]">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
      <div className="absolute bottom-4 right-4 md:bottom-6 md:left-8 md:right-auto z-50 text-[10px] md:text-xs font-mono font-semibold text-muted-foreground/50 pointer-events-none">
        v{packageInfo.version}
      </div>
    </div>
  );
}
