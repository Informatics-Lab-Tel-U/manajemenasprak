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
    modul: number;
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
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <PelanggaranForm
        onSubmit={onSubmit}
        onCancel={onClose}
        isLoading={isLoading}
        praktikumList={praktikumList}
        tahunAjaranList={tahunAjaranList}
        asprakList={asprakList}
        jadwalList={jadwalList}
      />
    </Dialog>
  );
}