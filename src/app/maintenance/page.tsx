'use client';

import { Wrench, Mail, MessageSquare, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background overflow-hidden relative">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-chart-1/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-chart-2/10 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <div className="max-w-md w-full relative z-10 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Icon with Glass Container */}
        <div className="inline-flex p-6 rounded-3xl bg-card/50 backdrop-blur-xl border border-white/10 shadow-2xl ring-1 ring-white/20 mb-2">
          <Wrench className="w-16 h-16 text-chart-2" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight title-gradient">
            Sedang Pemeliharaan
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Sistem Manajemen Asprak sedang dalam pembersihan berkala atau pembaruan fitur. Kami akan segera kembali!
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 gap-4 pt-4">
          <div className="p-4 rounded-xl bg-card/40 backdrop-blur-sm border border-border/50 text-left flex items-start gap-4">
            <div className="p-2 rounded-lg bg-chart-1/10 text-chart-1">
              <MessageSquare size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Butuh bantuan segera?</p>
              <p className="text-xs text-muted-foreground">Hubungi Asisten Laboratorium terkait.</p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-card/40 backdrop-blur-sm border border-border/50 text-left flex items-start gap-4">
            <div className="p-2 rounded-lg bg-chart-4/10 text-chart-4">
              <Instagram size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Instagram</p>
              <p className="text-xs text-muted-foreground">@Informaticslab_telu</p>
            </div>
          </div>
        </div>

        <div className="pt-8">
          <Link href="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Login sebagai Admin
            </Button>
          </Link>
        </div>

        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-medium pt-12">
          Informatics Lab Management System &copy; 2026
        </p>
      </div>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .title-gradient {
          background: linear-gradient(135deg, hsl(var(--chart-1)), hsl(var(--chart-2)), hsl(var(--chart-4)));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
}
