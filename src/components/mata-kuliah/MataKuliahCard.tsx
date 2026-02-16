import { Card } from "@/components/ui/card";
import { User, BookOpen } from "lucide-react";
import { MataKuliahWithPraktikum } from "@/services/mataKuliahService";
import { cn } from "@/lib/utils";

interface MataKuliahCardProps {
  mk: MataKuliahWithPraktikum;
}

export default function MataKuliahCard({ mk }: MataKuliahCardProps) {
  // Determine gradient and text color based on prodi
  const getProdiStyle = (prodi: string) => {
    const base = prodi.split('-')[0];
    switch (base) {
      case 'IF': return {
        gradient: 'from-blue-500/20 to-cyan-500/20',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200/50 dark:border-blue-500/20',
        icon: 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-500/20',
        pill: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20'
      };
      case 'IT': return {
        gradient: 'from-emerald-500/20 to-teal-500/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200/50 dark:border-emerald-500/20',
        icon: 'text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/20',
        pill: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
      };
      case 'SE': return {
        gradient: 'from-violet-500/20 to-purple-500/20',
        text: 'text-violet-700 dark:text-violet-300',
        border: 'border-violet-200/50 dark:border-violet-500/20',
        icon: 'text-violet-600 bg-violet-100 dark:text-violet-300 dark:bg-violet-500/20',
        pill: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20'
      };
      case 'DS': return {
        gradient: 'from-orange-500/20 to-amber-500/20',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200/50 dark:border-orange-500/20',
        icon: 'text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-500/20',
        pill: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20'
      };
      default: return {
        gradient: 'from-slate-500/20 to-gray-500/20',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200/50 dark:border-slate-500/20',
        icon: 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-500/20',
        pill: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20'
      };
    }
  };

  const style = getProdiStyle(mk.program_studi);
  const isPJJ = mk.program_studi.includes('PJJ');

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border backdrop-blur-sm",
      "bg-white/60 dark:bg-zinc-900/60", // Adaptive glass background
      style.border
    )}>
      {/* Dynamic Gradient Background Blob - Slightly reduced opacity in dark mode */}
      <div className={cn(
        "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-40 dark:opacity-20 bg-gradient-to-br transition-opacity group-hover:opacity-60 dark:group-hover:opacity-30",
        style.gradient
      )} />

      <div className="p-5 flex flex-col h-full relative z-10">
        
        {/* Header: Prodi & PJJ Badge */}
        <div className="flex justify-between items-start mb-3">
           <div className={cn(
             "px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border flex items-center gap-1.5 shadow-sm",
             style.pill
           )}>
              <BookOpen size={12} className="opacity-70" />
              {mk.program_studi}
           </div>
           
           {isPJJ && (
             <span className="text-[10px] font-bold text-muted-foreground/70 dark:text-muted-foreground bg-muted/50 dark:bg-muted/20 px-2 py-0.5 rounded-full border border-muted dark:border-white/10">
                PJJ
             </span>
           )}
        </div>

        {/* Main Content: Nama Mata Kuliah */}
        <div className="flex-grow mb-4">
           <h3 className="font-semibold text-base leading-snug text-foreground/90 dark:text-foreground group-hover:text-foreground transition-colors line-clamp-2" title={mk.nama_lengkap}>
             {mk.nama_lengkap}
           </h3>
           <p className="text-xs text-muted-foreground mt-1 font-mono opacity-80">
              {mk.praktikum.nama}
           </p>
        </div>

        {/* Footer: Dosen Koordinator */}
        <div className={cn(
            "mt-auto pt-3 border-t border-dashed flex items-center justify-between",
            "border-border/60 dark:border-white/10"
        )}>
           <div className="flex items-center gap-2">
              <div className={cn("h-7 w-7 rounded-sm flex items-center justify-center font-bold text-[10px] shadow-sm", style.icon)}>
                 {mk.dosen_koor?.substring(0, 1)}
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Koordinator</span>
                 <span className="text-xs font-bold text-foreground">{mk.dosen_koor}</span>
              </div>
           </div>
        </div>

      </div>
    </Card>
  );
}
