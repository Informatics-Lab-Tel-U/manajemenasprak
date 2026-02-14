
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen } from "lucide-react";
import { PraktikumWithStats } from "@/services/praktikumService";

interface PraktikumCardProps {
  praktikum: PraktikumWithStats;
  onClick: (praktikum: PraktikumWithStats) => void;
}

export default function PraktikumCard({ praktikum, onClick }: PraktikumCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow group border-l-4 border-l-transparent hover:border-l-primary"
      onClick={() => onClick(praktikum)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
          {praktikum.nama}
        </CardTitle>
        <BookOpen className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mt-2">
            <Badge variant="outline" className="font-mono text-xs">
                Term: {praktikum.tahun_ajaran}
            </Badge>
            <div className="flex items-center text-sm text-muted-foreground">
                <Users className="mr-1 h-3 w-3" />
                <span className="font-semibold">{praktikum.asprak_count}</span>
                <span className="ml-1 text-xs">Asprak</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
