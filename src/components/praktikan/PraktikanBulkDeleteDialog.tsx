'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PraktikanBulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  kelas: string;
  isDeleting?: boolean;
}

export default function PraktikanBulkDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  kelas,
  isDeleting,
}: PraktikanBulkDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus semua data kelas?</DialogTitle>
          <DialogDescription>
            Tindakan ini akan menghapus semua data praktikan yang terdaftar pada kelas{' '}
            <span className="font-semibold text-foreground">{kelas || '-'}</span> secara permanen.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Batal
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            <Trash2 size={16} className="mr-2" />
            {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
