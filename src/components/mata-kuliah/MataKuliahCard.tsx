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
    <Card className="@container/card bg-card shadow-sm hover:shadow-md transition-shadow group flex flex-col">
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

      <CardFooter className="mt-auto flex items-center gap-2 text-sm pt-4 border-t border-border/50">
        <UserCircle className="size-4 text-muted-foreground shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Koordinator</span>
          <span className="text-sm font-semibold text-foreground">{mk.dosen_koor}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
