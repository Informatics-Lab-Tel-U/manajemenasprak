import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster } from '@/components/ui/sonner';
import { requireAuth } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authUser = await requireAuth();

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          nama: authUser.pengguna.nama_lengkap,
          email: authUser.email,
          role: authUser.pengguna.role,
        }}
      />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border" />
          <h1 className="text-lg font-semibold">Manajemen Asisten Praktikum</h1>
          <ThemeToggle />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">{children}</main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
