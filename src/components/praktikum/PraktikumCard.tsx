import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from '@/components/ui/card';
import { Users, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PraktikumWithStats } from '@/services/praktikumService';

interface PraktikumCardProps {
  praktikum: PraktikumWithStats;
  onClick: (praktikum: PraktikumWithStats) => void;
}

export default function PraktikumCard({ praktikum, onClick }: PraktikumCardProps) {
  return (
    <Card
      className="@container/card bg-card shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onClick(praktikum)}
    >
      <CardHeader>
        <CardDescription>Praktikum</CardDescription>
        <CardTitle className="text-xl font-bold line-clamp-2 leading-tight transition-colors" title={praktikum.nama}>
          {praktikum.nama}
        </CardTitle>
        <CardAction>
          <Badge variant="outline" className="text-foreground/80">
            <BookOpen size={12} className="mr-1 opacity-70" />
            Term {praktikum.tahun_ajaran}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardFooter className="flex-col items-start gap-1.5 text-sm pt-4 border-t border-dashed">
        <div className="flex items-center gap-2 font-medium">
          <Users className="size-5 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none mb-1">
              Total Asprak
            </span>
            <span className="text-sm font-bold text-foreground leading-tight">
              {praktikum.asprak_count} Orang
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
