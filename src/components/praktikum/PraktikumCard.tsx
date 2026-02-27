import { Card } from "@/components/ui/card";
import { Users, BookOpen } from "lucide-react";
import { PraktikumWithStats } from "@/services/praktikumService";
import { cn } from "@/lib/utils";

interface PraktikumCardProps {
  praktikum: PraktikumWithStats;
  onClick: (praktikum: PraktikumWithStats) => void;
}

export default function PraktikumCard({ praktikum, onClick }: PraktikumCardProps) {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group border backdrop-blur-sm",
        "bg-white/60 dark:bg-zinc-900/60", // Adaptive glass background
        "border-indigo-200/50 dark:border-indigo-500/20"
      )}
      onClick={() => onClick(praktikum)}
    >
      {/* Dynamic Gradient Background Blob */}
      <div className={cn(
        "absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-40 dark:opacity-20 bg-gradient-to-br transition-opacity group-hover:opacity-60 dark:group-hover:opacity-30",
        "from-indigo-500/20 to-purple-500/20"
      )} />

      <div className="p-5 flex flex-col h-full relative z-10">
        
        {/* Header: Term Badge */}
        <div className="flex justify-between items-start mb-3">
           <div className={cn(
             "px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border flex items-center gap-1.5 shadow-sm",
             "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20"
           )}>
              <BookOpen size={12} className="opacity-70" />
              Term: {praktikum.tahun_ajaran}
           </div>
        </div>

        {/* Main Content: Nama Praktikum */}
        <div className="flex-grow mb-4">
           <h3 className="font-semibold text-lg leading-snug text-foreground/90 dark:text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2" title={praktikum.nama}>
             {praktikum.nama}
           </h3>
        </div>

        {/* Footer: Asprak Stats */}
        <div className={cn(
            "mt-auto pt-3 border-t border-dashed flex items-center justify-between",
            "border-border/60 dark:border-indigo-500/10"
        )}>
           <div className="flex items-center gap-2">
              <div className={cn(
                "h-7 w-7 rounded-sm flex items-center justify-center shadow-sm",
                "text-indigo-600 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-500/20"
              )}>
                 <Users size={14} />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total Asprak</span>
                 <span className="text-xs font-bold text-foreground">{praktikum.asprak_count} Orang</span>
              </div>
           </div>
        </div>

      </div>
    </Card>
  );
}
