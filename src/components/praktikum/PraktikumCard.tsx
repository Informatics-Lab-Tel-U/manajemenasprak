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
      className="@container/card bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
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

      <CardFooter className="mt-auto flex items-center gap-2 text-sm pt-4 border-t border-border/50">
        <Users className="size-4 text-muted-foreground shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Total Asprak</span>
          <span className="text-sm font-semibold text-foreground">
            {praktikum.asprak_count} Orang
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
