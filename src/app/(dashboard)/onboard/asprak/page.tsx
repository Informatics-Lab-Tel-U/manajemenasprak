import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';

export default function AsprakOnboardPlaceholder() {
  return (
    <div className="container space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/onboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Onboarding Data Asprak</h1>
          <p className="text-muted-foreground mt-1">
            Kelola data asisten praktikum dan generate kode akses.
          </p>
        </div>
      </div>

      <Card className="border shadow-sm text-center py-16">
        <CardContent className="flex flex-col items-center space-y-4">
          <div className="bg-muted p-4 rounded-full">
            <Construction className="w-12 h-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Halaman Sedang Dibangun</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Modul onboarding untuk Data Asprak sedang dalam tahap pengembangan. Silakan kembali lagi nanti.
          </CardDescription>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/onboard">Kembali ke Hub</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
