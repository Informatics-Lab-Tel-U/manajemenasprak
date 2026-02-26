'use client';

import { useState } from 'react';
import PelanggaranForm from './PelanggaranForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Asprak, Jadwal, Praktikum } from '@/types/database';

interface PelanggaranAddModalProps {
  onSubmit: (data: {
    id_asprak: string[];
    id_jadwal: string;
    jenis: string;
    modul: number | null;
  }) => Promise<void>;
  onClose: () => void;
  open: boolean;
  isLoading?: boolean;
  praktikumList: Praktikum[];
  tahunAjaranList: string[];
  asprakList: (Asprak & { praktikum_ids?: string[] })[];
  jadwalList: (Jadwal & { id_praktikum?: string })[];
}

export default function PelanggaranAddModal({
  onSubmit,
  onClose,
  open,
  isLoading = false,
  praktikumList,
  tahunAjaranList,
  asprakList,
  jadwalList,
}: PelanggaranAddModalProps) {
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/*
       * DialogContent base has: grid, p-6, gap-4, sm:max-w-lg, max-w-[calc(100%-2rem)]
       * We override ALL of those to get a flex-based layout with controlled sizing.
       */}
      <DialogContent
        className={`!flex !flex-col !gap-0 !p-0 overflow-hidden transition-[max-width,width] duration-200 ease-in-out
          ${sidePanelOpen
            ? '!max-w-[min(780px,95vw)] !w-[min(780px,95vw)]'
            : '!max-w-[min(520px,95vw)] !w-[min(520px,95vw)]'
          }
          h-[min(640px,85vh)]`}
      >
        {/* Header — fixed at top */}
        <DialogHeader className="border-b px-6 py-4 shrink-0">
          <DialogTitle>Catat Pelanggaran Baru</DialogTitle>
          <DialogDescription className="sr-only">
            Form untuk mencatat pelanggaran asprak praktikum
          </DialogDescription>
        </DialogHeader>

        {/* Body — fills remaining space, flex row for form + side panel */}
        <div className="min-h-0">
          <PelanggaranForm
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
            praktikumList={praktikumList}
            tahunAjaranList={tahunAjaranList}
            asprakList={asprakList}
            jadwalList={jadwalList}
            onSidePanelChange={(panel) => setSidePanelOpen(panel !== null)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}