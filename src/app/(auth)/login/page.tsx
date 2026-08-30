import { Suspense } from 'react';
import { GradientWave } from '@/components/ui/gradient-wave';
import { LoginForm } from '@/components/login/LoginForm';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Instagram } from 'lucide-react';
import packageInfo from '../../../../package.json';

export default function Page() {
  return (
    <div className="relative flex flex-col md:flex-row min-h-svh w-full">
      {/* Left panel (Branding) */}
      <div className="w-full md:w-[52%] lg:w-[60%] flex-1 md:h-dvh relative min-h-[280px] md:min-h-0 flex flex-col">
        <div className="absolute inset-0 z-0">
          <GradientWave />
        </div>

        {/* Top-left lab label */}
        <div className="relative z-10 px-6 pt-6 md:px-10 md:pt-8">
          <p className="text-xl font-semibold text-white/80 tracking-tight">
            Informatics Laboratory
          </p>
        </div>

        <div className="relative z-10 flex flex-col flex-1 max-w-2xl w-full mx-auto justify-center px-6 py-8 md:px-10">
          <Card className="bg-card/60 backdrop-blur-md border-border/50 shadow-2xl">
            <CardHeader className="pb-4 pt-6 px-6">
              <div className="flex items-center gap-4">
                <div className="relative size-16 shrink-0">
                  <Image
                    src="/iflab.png"
                    alt="Informatics Laboratory"
                    fill
                    priority
                    className="object-contain"
                  />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight">
                    Manajemen Asisten Praktikum
                  </CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    Laboratorium Informatika, Telkom University
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <Separator className="bg-border/50" />

            <CardContent className="pt-5 pb-5 px-6 space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Sistem ini hanya dapat diakses oleh <span className="text-foreground font-medium">Asisten Laboratorium, Koordinator Asisten Praktikum, dan Laboran</span> yang telah terdaftar.
              </p>
              <p>
                Gunakan akun Microsoft SSO Telkom University atau kredensial yang telah didaftarkan oleh administrator.
              </p>
            </CardContent>

            <Separator className="bg-border/50" />

            <CardFooter className="pt-4 pb-4 px-6">
              <a
                href="https://instagram.com/informaticslab_telu"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram className="size-3.5" />
                <span>@informaticslab_telu</span>
              </a>
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
