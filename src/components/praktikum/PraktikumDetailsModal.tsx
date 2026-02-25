'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Clock, MapPin, Users } from 'lucide-react';
import type { PraktikumWithStats, PraktikumDetails } from '@/services/praktikumService';
import { usePraktikum } from '@/hooks/usePraktikum';

interface PraktikumDetailsModalProps {
  praktikum: PraktikumWithStats;
  open: boolean;
  onClose: () => void;
}

export default function PraktikumDetailsModal({
  praktikum,
  open,
  onClose,
}: PraktikumDetailsModalProps) {
  const { getDetails } = usePraktikum();
  const [details, setDetails] = useState<PraktikumDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && praktikum) {
      setLoading(true);
      getDetails(praktikum.id).then((data) => {
        setDetails(data);
        setLoading(false);
      });
    }
  }, [open, praktikum, getDetails]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {praktikum.nama}
            <Badge variant="outline" className="font-mono text-xs font-normal">
              {praktikum.tahun_ajaran}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center justify-center p-3 border rounded-lg bg-muted/20">
              <span className="text-sm text-muted-foreground font-medium">Total Asprak</span>
              <div className="flex items-center mt-1">
                <Users className="w-4 h-4 mr-1.5 text-blue-500" />
                <span className="text-2xl font-bold">{praktikum.asprak_count}</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-3 border rounded-lg bg-muted/20">
              <span className="text-sm text-muted-foreground font-medium">Total Kelas</span>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mt-2 text-muted-foreground" />
              ) : (
                <div className="flex items-center mt-1">
                  <Calendar className="w-4 h-4 mr-1.5 text-green-500" />
                  <span className="text-2xl font-bold">{details?.total_kelas || 0}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Jadwal Kelas
            </h4>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !details || details.classes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg bg-muted/10">
                Belum ada jadwal kelas.
              </div>
            ) : (
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-3">
                  {details.classes.map((cls, idx) => (
                    <div key={idx} className="border rounded-md p-3 bg-card shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="secondary" className="font-semibold">
                          {cls.kelas}
                        </Badge>
                      </div>
                      <div className="space-y-1.5">
                        {cls.jadwal.map((j, jIdx) => (
                          <div
                            key={jIdx}
                            className="flex items-center text-sm text-muted-foreground"
                          >
                            <div className="flex items-center w-24 shrink-0">
                              <Calendar className="w-3.5 h-3.5 mr-1.5" />
                              <span>{j.hari}</span>
                            </div>
                            <div className="flex items-center w-24 shrink-0">
                              <Clock className="w-3.5 h-3.5 mr-1.5" />
                              <span>{j.jam}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-3.5 h-3.5 mr-1.5" />
                              <span>{j.ruangan || '-'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
