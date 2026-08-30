'use client';

import * as React from 'react';
import { ShieldCheck, ShieldAlert, Loader2, KeyRound } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getMfaStatus, unenrollTotp } from '@/app/actions/mfa';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function TwoFactorSecurityCard() {
  const router = useRouter();
  const [hasVerifiedFactor, setHasVerifiedFactor] = React.useState(false);
  const [factorId, setFactorId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isUnenrolling, setIsUnenrolling] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const fetchStatus = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMfaStatus();
      if (res.data) {
        setHasVerifiedFactor(res.data.hasVerifiedFactor);
        const verified = res.data.enrolledFactors.find((f) => f.status === 'verified');
        setFactorId(verified?.id || null);
      }
    } catch (err: any) {
      console.error('Failed to get 2FA status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleUnenroll = async () => {
    if (!factorId) return;
    setIsUnenrolling(true);
    try {
      const res = await unenrollTotp(factorId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Two-Factor Authentication berhasil dinonaktifkan');
        setIsModalOpen(false);
        await fetchStatus();
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menonaktifkan 2FA');
    } finally {
      setIsUnenrolling(false);
    }
  };

  return (
    <>
      <Card className="bg-card shadow-sm border-border/60">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <KeyRound className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Autentikasi Dua Langkah (2FA)</CardTitle>
                <CardDescription className="text-xs">
                  Amankan akses akun dengan kode TOTP (Google Authenticator / Microsoft Authenticator)
                </CardDescription>
              </div>
            </div>
            {!isLoading && (
              <Badge variant={hasVerifiedFactor ? 'default' : 'outline'} className="text-xs self-start sm:self-auto font-mono">
                {hasVerifiedFactor ? '2FA Aktif' : 'Belum Aktif'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl border border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {hasVerifiedFactor ? (
                  <ShieldCheck className="size-4 text-primary" />
                ) : (
                  <ShieldAlert className="size-4 text-muted-foreground" />
                )}
                <span className="text-sm font-semibold">
                  {hasVerifiedFactor ? 'Perangkat Authenticator Terdaftar' : 'Autentikasi 2FA Belum Dikonfigurasi'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                {hasVerifiedFactor
                  ? 'Akun ini dilindungi dengan verifikasi dua langkah (AAL2). Setiap kali login, sistem akan meminta 6 digit kode dari aplikasi authenticator Anda.'
                  : 'Sangat direkomendasikan untuk mengaktifkan 2FA guna mencegah pengambilalihan akun dan menjaga integritas data laboratorium.'}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : hasVerifiedFactor ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs text-destructive hover:bg-destructive/10"
                >
                  Reset / Hapus 2FA
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => router.push('/setup-2fa')}
                  className="text-xs"
                >
                  Konfigurasi 2FA
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog to Unenroll */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nonaktifkan Two-Factor Authentication?</DialogTitle>
            <DialogDescription>
              Tindakan ini akan menghapus koneksi aplikasi authenticator saat ini. Anda harus mendaftarkan ulang QR Code untuk mengaktifkannya kembali.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isUnenrolling}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnenroll}
              disabled={isUnenrolling}
            >
              {isUnenrolling ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Nonaktifkan 2FA'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
