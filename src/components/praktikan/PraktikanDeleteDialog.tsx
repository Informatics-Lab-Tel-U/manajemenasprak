'use client';

import { Trash2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PraktikanDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  name: string;
  isDeleting?: boolean;
}

export default function PraktikanDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  name,
  isDeleting,
}: PraktikanDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus data praktikan?</DialogTitle>
          <DialogDescription>
            Tindakan ini akan menghapus data{' '}
            <span className="font-semibold text-foreground">{name || '-'}</span> secara permanen.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Batal
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? <Spinner className="mr-2 h-4 w-4" /> : <Trash2 size={16} className="mr-2" />}
            {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
