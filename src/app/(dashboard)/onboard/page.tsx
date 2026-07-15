'use client';

/* eslint-disable react-doctor/no-fetch-in-effect, react-doctor/nextjs-no-client-fetch-for-server-data */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, BookOpen, Users, Check, Lock, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import TermInput from '@/components/asprak/TermInput';
import { useTermStore } from '@/store/useTermStore';

export default function OnboardHubPage() {
  const { activeTerm } = useTermStore();
  const [termYear, setTermYear] = useState(activeTerm ? activeTerm.substring(0, 2) : '24');
  const [termSem, setTermSem] = useState<'1' | '2'>(activeTerm ? (activeTerm.slice(-1) as '1'|'2') : '2');
  
  const currentTerm = `${termYear}${parseInt(termYear) + 1}-${termSem}`;

  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const availableTerms = useRef<string[]>([]);

  // Sync with activeTerm once it hydrates from localStorage
  useEffect(() => {
    if (activeTerm && activeTerm.length >= 6) {
      setTermYear(activeTerm.substring(0, 2));
      setTermSem(activeTerm.slice(-1) as '1' | '2');
    }
  }, [activeTerm]);

  // Fetch available terms for smart switching
  useEffect(() => {
    fetch('/api/tahun-ajaran')
      .then((res) => res.json())
      .then((res) => {
        if (res.ok) {
          availableTerms.current = res.data;
        }
      })
      .catch(console.error);
  }, []);

  const handleYearChange = (newYear: string) => {
    setTermYear(newYear);
    
    // Smart semester switching logic
    if (newYear.length === 2 && !isNaN(parseInt(newYear))) {
      const newTermPrefix = `${newYear}${parseInt(newYear) + 1}`;
      const targetTerm = `${newTermPrefix}-${termSem}`;
      
      // If the targeted term doesn't exist in the DB
      if (!availableTerms.current.includes(targetTerm)) {
        const otherSem = termSem === '1' ? '2' : '1';
        const otherTerm = `${newTermPrefix}-${otherSem}`;
        
        // If the other semester exists, switch to it
        if (availableTerms.current.includes(otherTerm)) {
          setTermSem(otherSem);
        } else {
          // If neither exists (brand new year), default to semester 1 (Ganjil)
          setTermSem('1');
        }
      }
    }
  };

  useEffect(() => {
    if (!currentTerm) return;
    let isMounted = true;
    setIsLoading(true);
    
    fetch(`/api/onboard/status?term=${currentTerm}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setStatus(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentTerm]);

  return (
    <div className="container mx-auto max-w-[2000px] space-y-8 2xl:px-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Setup Tahun Ajaran</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Pilih modul onboarding yang ingin Anda konfigurasi.
        </p>
      </div>

      <div className="relative mt-12 space-y-8 max-w-6xl mx-auto">
        {/* Timeline Connecting Line dihapus, dipindah ke masing-masing step */}

        {isLoading ? (
          <div className="space-y-8">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="relative flex flex-col md:flex-row gap-6 items-stretch md:items-start">
                {i < 3 && <div className="absolute top-10 bottom-[-32px] left-[19px] w-0.5 hidden md:block bg-border"></div>}
                <div className="hidden md:flex relative z-10 items-center justify-center size-10 rounded-md border-[3px] border-background bg-muted shrink-0 shadow-sm">
                   <Skeleton className="w-5 h-5 rounded-md" />
                </div>
                <Card className="flex-1 flex flex-col shadow-sm min-h-[200px] border-border bg-card">
                  <CardHeader className="flex-grow">
                    <Skeleton className="h-7 w-2/3 sm:w-1/3" />
                    <Skeleton className="h-5 w-full sm:w-1/2" />
                  </CardHeader>
                  {i === 0 ? (
                    <CardContent>
                      <div className="flex gap-4 max-w-[280px]">
                        <Skeleton className="h-10 w-20 rounded-md shrink-0" />
                        <Skeleton className="h-10 flex-1 rounded-md" />
                      </div>
                    </CardContent>
                  ) : (
                    <CardFooter>
                      <Skeleton className="h-10 w-full sm:w-32 rounded-md" />
                    </CardFooter>
                  )}
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Card 0: Tahun Ajaran Target */}
            <div className="relative flex flex-col md:flex-row gap-6 items-stretch md:items-start group">
              <div className="absolute top-10 bottom-[-32px] left-[19px] w-0.5 hidden md:block bg-primary"></div>
              <div className="hidden md:flex relative z-10 size-10 shrink-0 items-center justify-center overflow-hidden rounded-md text-sm font-medium transition-all duration-300 border-[3px] border-background bg-primary text-primary-foreground shadow-sm">
                <Target className="w-5 h-5" />
              </div>
              <Card className="flex-1 flex flex-col transition-all duration-300 shadow-sm border-border bg-card min-h-[200px]">
                <CardHeader className="flex-grow">
                  <CardTitle className="text-xl">Target Setup</CardTitle>
                  <CardDescription className="text-base">
                    Tentukan konteks tahun ajaran yang akan Anda setup.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-w-md">
                    <TermInput
                      termYear={termYear}
                      termSem={termSem}
                      onYearChange={handleYearChange}
                      onSemChange={setTermSem}
                      label=""
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Card 1: Tahun Ajaran & Praktikum */}
            <div className="relative flex flex-col md:flex-row gap-6 items-stretch md:items-start group">
              <div className={`absolute top-10 bottom-[-32px] left-[19px] w-0.5 hidden md:block transition-colors duration-500 ${status?.step1_done ? 'bg-primary' : 'bg-border'}`}></div>
              <div className={`hidden md:flex relative z-10 size-10 shrink-0 items-center justify-center overflow-hidden rounded-md text-base font-medium transition-all duration-300 border-[3px] border-background shadow-sm bg-primary text-primary-foreground ${!status?.step1_done ? 'ring-primary/30 ring-2 ring-offset-2 ring-offset-background' : ''}`}>
                {status?.step1_done ? <Check className="w-5 h-5" strokeWidth={3} /> : '1'}
              </div>
              <Card className={`flex-1 flex flex-col transition-all duration-300 shadow-sm min-h-[200px] ${status?.step1_done ? 'border-border bg-card' : 'border-primary ring-1 ring-primary shadow-md bg-card'}`}>
                <CardHeader className="flex-grow">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-xl">Langkah 1: Tahun Ajaran & Praktikum</CardTitle>
                    {status?.step1_done && <Check className="w-5 h-5 text-primary md:hidden shrink-0 mt-0.5" strokeWidth={3} />}
                  </div>
                  <CardDescription className="text-base">
                    Inisialisasi tahun ajaran baru, daftar praktikum, dan referensi mata kuliah.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild className="w-full sm:w-auto" variant={status?.step1_done ? "outline" : "default"}>
                    <Link href={`/onboard/tahun-ajaran-baru?term=${currentTerm}`}>
                      {status?.step1_done ? 'Edit Data' : 'Mulai Setup'}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Card 2: Jadwal Praktikum */}
            <div className="relative flex flex-col md:flex-row gap-6 items-stretch md:items-start group">
              <div className={`absolute top-10 bottom-[-32px] left-[19px] w-0.5 hidden md:block transition-colors duration-500 ${status?.step2_done ? 'bg-primary' : 'bg-border'}`}></div>
              <div className={`hidden md:flex relative z-10 size-10 shrink-0 items-center justify-center overflow-hidden rounded-md text-base font-medium transition-all duration-300 border-[3px] border-background shadow-sm ${status?.step2_done || status?.step1_done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} ${!status?.step2_done && status?.step1_done ? 'ring-primary/30 ring-2 ring-offset-2 ring-offset-background' : ''}`}>
                {status?.step2_done ? <Check className="w-5 h-5" strokeWidth={3} /> : !status?.step1_done ? <Lock className="w-4 h-4" /> : '2'}
              </div>
              <Card className={`flex-1 flex flex-col transition-all duration-300 shadow-sm min-h-[200px] ${status?.step2_done ? 'border-border bg-card' : status?.step1_done ? 'border-primary ring-1 ring-primary shadow-md bg-card' : 'opacity-70 bg-muted/30 border-border'}`}>
                <CardHeader className="flex-grow">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-xl">Langkah 2: Jadwal Praktikum</CardTitle>
                    <div className="md:hidden shrink-0 mt-0.5">
                      {status?.step2_done ? <Check className="w-5 h-5 text-primary" strokeWidth={3} /> : (!status?.step1_done && !isLoading && <Lock className="w-4 h-4 text-muted-foreground" />)}
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    Konfigurasi shift, tanggal modul, dan plotting jadwal asisten.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button 
                    asChild 
                    variant={status?.step2_done ? "outline" : "default"} 
                    className={`w-full sm:w-auto group ${!status?.step2_done && status?.step1_done ? 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950/50 bg-blue-600 text-white' : ''}`}
                    disabled={!status?.step1_done}
                  >
                    <Link href={status?.step1_done ? `/onboard/jadwal?term=${currentTerm}` : '#'}>
                      {status?.step2_done ? 'Edit Data' : status?.step1_done ? 'Mulai Setup' : 'Terkunci'}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Card 3: Data Asprak */}
            <div className="relative flex flex-col md:flex-row gap-6 items-stretch md:items-start group">
              <div className={`hidden md:flex relative z-10 size-10 shrink-0 items-center justify-center overflow-hidden rounded-md text-base font-medium transition-all duration-300 border-[3px] border-background shadow-sm ${status?.step3_done || status?.step2_done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} ${!status?.step3_done && status?.step2_done ? 'ring-primary/30 ring-2 ring-offset-2 ring-offset-background' : ''}`}>
                {status?.step3_done ? <Check className="w-5 h-5" strokeWidth={3} /> : !status?.step2_done ? <Lock className="w-4 h-4" /> : '3'}
              </div>
              <Card className={`flex-1 flex flex-col transition-all duration-300 shadow-sm min-h-[200px] ${status?.step3_done ? 'border-border bg-card' : status?.step2_done ? 'border-primary ring-1 ring-primary shadow-md bg-card' : 'opacity-70 bg-muted/30 border-border'}`}>
                <CardHeader className="flex-grow">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-xl">Langkah 3: Data Asprak</CardTitle>
                    <div className="md:hidden shrink-0 mt-0.5">
                      {status?.step3_done ? <Check className="w-5 h-5 text-primary" strokeWidth={3} /> : (!status?.step2_done && !isLoading && <Lock className="w-4 h-4 text-muted-foreground" />)}
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    Kelola data asisten praktikum, generate kode asprak, dan plotting.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button 
                    asChild 
                    variant={status?.step3_done ? "outline" : "default"} 
                    className={`w-full sm:w-auto group ${!status?.step3_done && status?.step2_done ? 'hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 dark:hover:bg-orange-950/50 bg-orange-600 text-white' : ''}`}
                    disabled={!status?.step2_done}
                  >
                    <Link href={status?.step2_done ? `/onboard/asprak?term=${currentTerm}` : '#'}>
                      {status?.step3_done ? 'Edit Data' : status?.step2_done ? 'Mulai Setup' : 'Terkunci'}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
