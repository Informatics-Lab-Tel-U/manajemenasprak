import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Generator Presensi | Manajemen Asprak',
};

const PresensiGeneratorClient = dynamic(() => import('./PresensiGeneratorClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full space-y-6">
      <Card className="bg-card shadow-sm border-border/60">
        <CardHeader>
          <Skeleton className="h-6 w-60" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  ),
});

export default function PresensiPage() {
  return (
    <div className="container mx-auto max-w-[2000px] 2xl:px-8 relative space-y-6">
      <header className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl 2xl:text-3xl font-bold tracking-tight">Generator Presensi</h1>
            <p className="text-sm 2xl:text-base text-muted-foreground mt-1">
              Buat template absensi asisten praktikum dalam format Excel secara otomatis.
            </p>
          </div>
        </div>
      </header>

      <PresensiGeneratorClient />
    </div>
  );
}
