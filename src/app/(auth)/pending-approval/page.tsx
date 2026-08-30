'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, LogOut, RefreshCw, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { logout } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { Spinner } from '@/components/ui/spinner';

export default function PendingApprovalPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [userName, setUserName] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadUserData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        setUserName(
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Pengguna'
        );
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

  function handleCheckStatus() {
    setIsChecking(true);
    router.refresh();
    setTimeout(() => setIsChecking(false), 800);
  }

  return (
    <div className="min-h-svh w-full flex items-center justify-center p-4 md:p-8 bg-background relative overflow-hidden">
      {/* Subtle background ambient blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full blur-3xl pointer-events-none" />
      <Card className="max-w-lg w-full glass border-border/60 shadow-2xl relative z-10 overflow-hidden">
        <CardHeader className="text-center pb-2 pt-2">
          <CardTitle className="text-2xl font-bold tracking-tight">Menunggu Persetujuan Akses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {/* User info container */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/40 space-y-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                Microsoft Account
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Terverifikasi SSO
              </span>
            </div>
            <div className="font-semibold text-foreground text-base truncate">
              {userName || 'Memuat...'}
            </div>
            <div className="text-muted-foreground font-mono text-xs truncate">
              {userEmail || '...'}
            </div>
          </div>
        </CardContent>

        <Separator className="bg-border/50" />

        <CardFooter className="pt-4 pb-6 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full sm:w-auto flex-1 gap-2"
          >
            {isLoggingOut ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
            Keluar / Ganti Akun
          </Button>

          <Button
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="w-full sm:w-auto flex-1 gap-2"
          >
            <RefreshCw className={`size-4 ${isChecking ? 'animate-spin' : ''}`} />
            Periksa Status Akses
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
