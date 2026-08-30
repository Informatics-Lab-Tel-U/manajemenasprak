'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogOut, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { logout } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { Spinner } from '@/components/ui/spinner';

export default function RejectedPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadUserData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
      }
    }
    loadUserData();
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="min-h-svh w-full flex items-center justify-center p-4 md:p-8 bg-background relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="max-w-lg w-full glass border-border/60 shadow-2xl relative z-10 overflow-hidden">
        <CardHeader className="text-center pb-4 pt-8">
          <div className="mx-auto size-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4 text-destructive shadow-inner">
            <ShieldAlert className="size-8" />
          </div>
          <div className="flex justify-center mb-2">
            <Badge variant="destructive" className="gap-1.5 px-3 py-0.5">
              Permintaan Akses Ditolak
            </Badge>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Akses Tidak Diberikan</CardTitle>
          <CardDescription className="text-sm mt-1 text-muted-foreground">
            Permintaan akses untuk akun Anda saat ini tidak disetujui oleh Administrator Laboratorium
          </CardDescription>
        </CardHeader>

        <Separator className="bg-border/50" />

        <CardContent className="pt-6 space-y-4 text-sm">
          <div className="p-4 rounded-xl bg-muted/40 border border-border/40 space-y-1">
            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Mail className="size-3.5" /> Akun Terhubung
            </div>
            <div className="font-mono text-xs text-foreground truncate">
              {userEmail || '...'}
            </div>
          </div>

          <div className="text-muted-foreground text-xs leading-relaxed pl-1 space-y-2">
            <p>
              Jika Anda merasa ini adalah kekeliruan atau Anda merupakan asisten laboratorium aktif semester ini, silakan hubungi Koordinator Asisten atau Laboran Informatika.
            </p>
          </div>
        </CardContent>

        <Separator className="bg-border/50" />

        <CardFooter className="pt-4 pb-6 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full gap-2"
          >
            {isLoggingOut ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
            Keluar / Ganti Akun Lain
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
