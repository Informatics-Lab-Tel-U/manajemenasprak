import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from '@/components/ui/card';
import { BookOpen, UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MataKuliahWithPraktikum } from '@/services/mataKuliahService';

interface MataKuliahCardProps {
  mk: MataKuliahWithPraktikum;
}

export default function MataKuliahCard({ mk }: MataKuliahCardProps) {
  const isPJJ = mk.program_studi.includes('PJJ');

  return (
    <Card className="@container/card bg-card shadow-sm hover:shadow-md transition-all group">
      <CardHeader>
        <CardDescription className="line-clamp-1">{mk.praktikum.nama}</CardDescription>
        <CardTitle className="text-lg 2xl:text-xl font-bold line-clamp-2 leading-tight transition-colors" title={mk.nama_lengkap}>
          {mk.nama_lengkap}
        </CardTitle>
        <CardAction className="flex gap-1.5 flex-col items-end">
          <Badge variant="outline" className="text-foreground/80">
            <BookOpen size={12} className="mr-1 opacity-70" />
            {mk.program_studi}
          </Badge>
          {isPJJ && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              PJJ
            </Badge>
          )}
        </CardAction>
      </CardHeader>

      <CardFooter className="flex-col items-start gap-1.5 text-sm pt-4 border-t border-dashed">
        <div className="flex items-center gap-2 font-medium">
          <UserCircle className="size-5 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none mb-1">
              Koordinator
            </span>
            <span className="text-sm font-bold text-foreground leading-tight">{mk.dosen_koor}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
