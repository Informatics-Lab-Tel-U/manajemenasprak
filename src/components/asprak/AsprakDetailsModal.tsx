import { Asprak } from '@/types/database';
import { AsprakAssignment } from '@/lib/fetchers/asprakFetcher';
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AsprakWithAssignments extends Asprak {
  assignments?: AsprakAssignment[];
}

interface AsprakDetailsModalProps {
  asprak: AsprakWithAssignments;
  loading: boolean;
  onClose: () => void;
  open: boolean;
}

export default function AsprakDetailsModal({
  asprak,
  loading,
  onClose,
  open,
}: AsprakDetailsModalProps) {
  const groupedAssignments = useMemo(() => {
    if (!asprak.assignments) return {};
    const groups: Record<string, string[]> = {};

    asprak.assignments.forEach((item: any) => {
      const term = item.praktikum?.tahun_ajaran || 'Unknown Term';
      if (!groups[term]) groups[term] = [];
      groups[term].push(item.praktikum?.nama);
    });

    return groups;
  }, [asprak.assignments]);

  const terms = Object.keys(groupedAssignments).sort().reverse();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4">Detail Asisten Praktikum</DialogTitle>
          <ScrollArea className="flex max-h-full flex-col overflow-hidden">
            <div className="px-6 py-4 space-y-6">
              {/* Asprak Info */}
              <div className="">
                <div className="">{asprak.kode}</div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold">{asprak.nama_lengkap}</h3>
                  <p className="text-sm text-muted-foreground">
                    {asprak.nim} • Angkatan {asprak.angkatan}
                  </p>
                </div>
              </div>

              {/* Assignment History */}
              <div>
                <h4 className="text-base font-semibold mb-4">Assignment History</h4>

                {loading ? (
                  <div className="text-center text-muted-foreground py-8">
                    <div className="inline-block animate-pulse">Loading assignments...</div>
                  </div>
                ) : terms.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 bg-muted/20 rounded-lg">
                    <p>No assignments found.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {terms.map((term) => (
                      <div key={term} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-px flex-1 bg-border" />
                          <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-3 whitespace-nowrap">
                            Term {term}
                          </h5>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {groupedAssignments[term].map((mk, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="px-3 py-1.5 font-medium"
                            >
                              {mk}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
