'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { GradientWave } from '@/components/ui/gradient-wave';
import { logout } from '@/app/actions/auth';
import { enrollTotp, verifyTotp } from '@/app/actions/mfa';
import { createClient } from '@/lib/supabase/client';
import { AUTH_CONFIG } from '@/config/auth';
import { toast } from 'sonner';
import Image from 'next/image';
import { Instagram } from 'lucide-react';
import packageInfo from '../../../../package.json';

export default function Setup2FAPage() {
  const router = useRouter();
  const [qrCodeSvg, setQrCodeSvg] = React.useState<string | null>(null);
  const [secret, setSecret] = React.useState<string | null>(null);
  const [factorId, setFactorId] = React.useState<string | null>(null);
  const [code, setCode] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isInitializing, setIsInitializing] = React.useState(true);

  React.useEffect(() => {
    async function initEnroll() {
      try {
        const res = await enrollTotp();
        if (res.alreadyEnrolled) {
          router.replace(AUTH_CONFIG.paths.verify2fa);
          return;
        }
        if (res.error) {
          setError(res.error);
        } else if (res.data) {
          setQrCodeSvg(res.data.qrCode);
          setSecret(res.data.secret);
          setFactorId(res.data.id);
        }
      } catch (err: any) {
        setError(err.message || 'Gagal memulai inisialisasi 2FA');
      } finally {
        setIsInitializing(false);
      }
    }
    initEnroll();
  }, []);

  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    toast.success('Kunci rahasia disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
    if (error) setError(null);
  };

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;

    const cleanCode = code.trim().replace(/\s+/g, '');
    if (cleanCode.length !== 6) {
      setError('Masukkan 6 digit kode dari aplikasi authenticator');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await verifyTotp(factorId, cleanCode);
      if (res.error) {
        setError(res.error);
      } else {
        toast.success('Two-Factor Authentication berhasil diaktifkan!');
        window.location.href = '/';
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi kode');
    } finally {
      setIsLoading(false);
    }
  }

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
          <p className="text-sm text-muted-foreground">Menyiapkan pendaftaran 2FA...</p>
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
                Sebagai administrator, akun Anda diwajibkan mengaktifkan{' '}
                <span className="text-foreground font-medium">
                  Autentikasi Dua Langkah (2FA)
                </span>{' '}
                untuk melindungi hak akses sistem laboratorium.
              </p>
              <p>
                Proses ini hanya dilakukan sekali. Gunakan aplikasi seperti Google Authenticator
                atau Microsoft Authenticator.
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
      <div className="w-full md:w-[48%] lg:w-[40%] shrink-0 bg-background flex flex-col justify-center items-center py-8 z-10 rounded-t-3xl md:rounded-none md:h-dvh shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none overflow-y-auto">
        <div className="p-6 w-full max-w-md lg:w-[80%]">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Aktifkan 2FA</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Hubungkan akun Anda dengan aplikasi authenticator
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

                {/* Step 1: Scan QR */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-foreground">
                    1. Pindai QR Code dengan Aplikasi Authenticator
                  </p>
                  <div className="flex justify-center">
                    {qrCodeSvg ? (
                      <div
                        className="bg-white p-3 rounded-lg border shadow-sm inline-block"
                        dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                      />
                    ) : (
                      <div className="size-48 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                        Memuat QR...
                      </div>
                    )}
                  </div>

                  {secret && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-muted-foreground block">
                        Atau masukkan kunci rahasia secara manual:
                      </span>
                      <div className="flex items-center gap-2">
                        <code className="px-2.5 py-1 text-xs bg-muted border rounded font-mono font-bold flex-1 select-all break-all">
                          {secret}
                        </code>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCopySecret}
                          className="h-8 shrink-0 text-xs gap-1"
                        >
                          {copied ? (
                            <Check className="size-3.5 text-green-500" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                          {copied ? 'Tersalin' : 'Salin'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Step 2: Confirmation code */}
                <form onSubmit={handleVerify} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="setupOtp">2. Masukkan 6 Digit Kode dari Aplikasi</Label>
                    <Input
                      id="setupOtp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
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
                    className="w-full"
                    disabled={isLoading || code.length !== 6 || !factorId}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengaktifkan 2FA...
                      </>
                    ) : (
                      'Konfirmasi & Aktifkan 2FA'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Batal & keluar dari sesi?</span>
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
