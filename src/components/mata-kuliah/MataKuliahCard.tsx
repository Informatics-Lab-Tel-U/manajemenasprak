import { Card } from "@/components/ui/card";
import { User, BookOpen } from "lucide-react";
import { MataKuliahWithPraktikum } from "@/services/mataKuliahService";
import { cn } from "@/lib/utils";

interface MataKuliahCardProps {
  mk: MataKuliahWithPraktikum;
}

export default function MataKuliahCard({ mk }: MataKuliahCardProps) {
  // Use primary color theme for all cards to ensure visual consistency
  const theme = {
    gradient: 'from-primary/20 to-blue-500/20',
    text: 'text-primary dark:text-primary-foreground/90',
    border: 'border-primary/20 dark:border-primary/20',
    icon: 'text-primary bg-primary/10 dark:text-primary-foreground/90 dark:bg-primary/20',
    pill: 'bg-primary/5 text-primary border-primary/20 dark:bg-primary/10 dark:text-primary-foreground/90 dark:border-primary/30'
  };

  const isPJJ = mk.program_studi.includes('PJJ');

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border backdrop-blur-sm",
      "bg-white/60 dark:bg-zinc-900/60 rounded-xl", // Consistency with rounded-xl
      theme.border
    )}>
      {/* Dynamic Gradient Background Blob - Primary Color */}
      <div className={cn(
        "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-40 dark:opacity-20 bg-gradient-to-br transition-opacity group-hover:opacity-60 dark:group-hover:opacity-30",
        theme.gradient
      )} />

      <div className="p-5 flex flex-col h-full relative z-10">
        
        {/* Header: Prodi & PJJ Badge */}
        <div className="flex justify-between items-start mb-3">
           <div className={cn(
             "px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border flex items-center gap-1.5 shadow-sm",
             theme.pill
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
           <h3 className="font-semibold text-base leading-snug text-foreground/90 dark:text-foreground group-hover:text-primary transition-colors line-clamp-2" title={mk.nama_lengkap}>
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
              <div className={cn("h-7 w-7 rounded-sm flex items-center justify-center font-bold text-[10px] shadow-sm", theme.icon)}>
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
