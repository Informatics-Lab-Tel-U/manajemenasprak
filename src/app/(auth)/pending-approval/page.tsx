'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      const supabase = createClient();
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      window.location.href = '/login';
    }
  }

  function handleCheckStatus() {
    setIsChecking(true);
    router.refresh();
    setTimeout(() => setIsChecking(false), 800);
  }

  return (
    <div className="min-h-svh w-full flex items-center justify-center p-4 md:p-8 bg-background">
      <Card className="max-w-lg w-full border-border/60 shadow-md">
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
