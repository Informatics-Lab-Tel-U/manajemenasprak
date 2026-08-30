'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { GradientWave } from '@/components/ui/gradient-wave';
import { logout } from '@/app/actions/auth';
import { getMfaStatus, verifyTotp } from '@/app/actions/mfa';
import { createClient } from '@/lib/supabase/client';
import { AUTH_CONFIG } from '@/config/auth';
import Image from 'next/image';
import { Instagram } from 'lucide-react';
import packageInfo from '../../../../package.json';

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = React.useState('');
  const [factorId, setFactorId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isInitializing, setIsInitializing] = React.useState(true);

  React.useEffect(() => {
    async function init() {
      try {
        const res = await getMfaStatus();
        if (res.error) {
          setError(res.error);
          return;
        }

        if (res.data?.currentLevel === 'aal2') {
          window.location.href = '/';
          return;
        }

        const activeFactor = res.data?.enrolledFactors.find((f) => f.status === 'verified');
        if (activeFactor) {
          setFactorId(activeFactor.id);
        } else {
          router.replace(AUTH_CONFIG.paths.setup2fa);
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memuat status autentikasi');
      } finally {
        setIsInitializing(false);
      }
    }
    init();
  }, [router]);

  async function handleSubmit(e?: React.FormEvent, customCode?: string) {
    if (e) e.preventDefault();
    if (!factorId) return;

    const rawCode = customCode ?? code;
    const cleanCode = rawCode.trim().replace(/\s+/g, '');
    if (cleanCode.length !== 6) {
      setError('Masukkan 6 digit kode autentikasi');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await verifyTotp(factorId, cleanCode);
      if (res.error) {
        setError(res.error);
        setCode('');
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memverifikasi kode');
    } finally {
      setIsLoading(false);
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
    if (error) setError(null);
  };

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      const supabase = createClient();
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      window.location.href = AUTH_CONFIG.paths.login;
    }
  }

  if (isInitializing) {
    return (
      <div className="min-h-svh w-full flex items-center justify-center p-4 bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Memeriksa status keamanan...</p>
        </div>
      </div>
    );
  }

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
                Langkah terakhir sebelum masuk: verifikasi identitas Anda menggunakan{' '}
                <span className="text-foreground font-medium">kode 6 digit</span> dari aplikasi
                authenticator di ponsel Anda.
              </p>
              <p>
                Kode ini diperbarui setiap 30 detik. Pastikan waktu ponsel Anda sudah tersinkron
                dengan benar.
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
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Verifikasi 2FA</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Masukkan kode dari aplikasi authenticator Anda
              </p>
            </div>

            <Card className="glass border-border/60 shadow-xl">
              <CardContent className="flex flex-col gap-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs leading-relaxed">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                  <ShieldCheck className="size-5 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Buka Google Authenticator, Microsoft Authenticator, atau aplikasi serupa di
                    ponsel Anda.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="otpCode">Kode Keamanan 6-Digit</Label>
                    <Input
                      id="otpCode"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      autoComplete="one-time-code"
                      placeholder="123456"
                      value={code}
                      onChange={handleCodeChange}
                      disabled={isLoading}
                      className="text-center font-mono tracking-widest text-base"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2"
                    disabled={isLoading || code.length !== 6 || !factorId}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memverifikasi...
                      </>
                    ) : (
                      'Verifikasi & Masuk'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Bukan akun Anda?</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-xs"
              >
                {isLoggingOut ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                )}
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 md:bottom-6 md:left-8 md:right-auto z-50 text-[10px] md:text-xs font-mono font-semibold text-muted-foreground/50 pointer-events-none">
        v{packageInfo.version}
      </div>
    </div>
  );
}
