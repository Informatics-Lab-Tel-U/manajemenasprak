'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AuthBrandingPanel } from '@/components/auth/AuthBrandingPanel';
import { logout } from '@/app/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { AUTH_CONFIG } from '@/config/auth';
import packageInfo from '../../../../package.json';

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
      window.location.href = AUTH_CONFIG.paths.login;
    }
  }

  function handleCheckStatus() {
    setIsChecking(true);
    router.refresh();
    setTimeout(() => setIsChecking(false), 800);
  }

  return (
    <div className="relative flex flex-col md:flex-row min-h-svh w-full">
      <AuthBrandingPanel />

      {/* Right panel */}
      <div className="w-full md:w-[48%] lg:w-[40%] shrink-0 bg-background flex flex-col justify-center items-center py-8 z-10 rounded-t-3xl md:rounded-none md:h-dvh shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none">
        <div className="p-6 w-full max-w-md lg:w-[80%]">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Menunggu Persetujuan</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Permintaan akses sedang ditinjau oleh administrator
              </p>
            </div>

            <Card className="glass border-border/60 shadow-xl">
              <CardContent className="flex flex-col gap-5">
                {/* User info */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Akun yang masuk</p>
                  <div className="p-3 rounded-lg border border-border/50 bg-muted/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">
                        {userName || (
                          <span className="text-muted-foreground">Memuat...</span>
                        )}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0 ml-2">
                        <CheckCircle2 className="size-3" />
                        SSO
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {userEmail || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/40 border border-border/50 text-xs text-muted-foreground">
                  <Clock className="size-4 shrink-0" />
                  <span>Akses akan otomatis aktif setelah disetujui.</span>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex flex-col gap-2.5">
                  <Button
                    onClick={handleCheckStatus}
                    disabled={isChecking}
                    className="w-full gap-2"
                  >
                    {isChecking ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                    Periksa Status Akses
                  </Button>

                  <Button
                    type="button"
                    variant="destructive-outline"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Keluar...
                      </>
                    ) : (
                      'Keluar'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 md:bottom-6 md:left-8 md:right-auto z-50 text-[10px] md:text-xs font-mono font-semibold text-muted-foreground/50 pointer-events-none">
        v{packageInfo.version}
      </div>
    </div>
  );
}
