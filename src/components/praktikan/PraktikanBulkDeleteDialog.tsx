'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type BulkDeletePayload = { action: 'kelas' | 'all'; kelas?: string };

interface PraktikanBulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: BulkDeletePayload) => Promise<void>;
  options: string[];
  isDeleting?: boolean;
}

export default function PraktikanBulkDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  options,
  isDeleting,
}: PraktikanBulkDeleteDialogProps) {
  const [mode, setMode] = useState<'kelas' | 'all'>('kelas');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMode('kelas');
      setSelectedKelas(options.length > 0 ? options[0] : '');
      setConfirmText('');
    }
  }

  const isFormValid = () => {
    if (mode === 'kelas') {
      return selectedKelas !== '';
    }
    return confirmText === 'HAPUS SEMUA';
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;
    onConfirm({ action: mode, kelas: mode === 'kelas' ? selectedKelas : undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Hapus Data Praktikan (Bulk)</DialogTitle>
          <DialogDescription>
            Pilih metode penghapusan massal. Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <RadioGroup value={mode} onValueChange={(val: 'kelas' | 'all') => setMode(val)}>
            <div className="flex flex-col gap-4">
              {/* Opsi Kelas */}
              <div className="flex items-start space-x-3 rounded-md border p-4">
                <RadioGroupItem value="kelas" id="mode-kelas" className="mt-1" />
                <div className="space-y-2 flex-1">
                  <Label htmlFor="mode-kelas" className="font-semibold cursor-pointer">
                    Hapus Berdasarkan Kelas
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Menghapus seluruh praktikan yang tergabung di dalam kelas tertentu.
                  </p>
                  {mode === 'kelas' && (
                    <div className="pt-2">
                      <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kelas yang akan dihapus" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Opsi Semua Data */}
              <div className="flex items-start space-x-3 rounded-md border p-4">
                <RadioGroupItem value="all" id="mode-all" className="mt-1" />
                <div className="space-y-2 flex-1">
                  <Label htmlFor="mode-all" className="font-semibold text-destructive cursor-pointer">
                    Hapus Seluruh Data
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mengosongkan tabel praktikan secara keseluruhan. Pilihan yang sangat destruktif!
                  </p>
                  {mode === 'all' && (
                    <div className="pt-3 space-y-3">
                      <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                        <span>Ketik <strong>HAPUS SEMUA</strong> di bawah ini untuk mengkonfirmasi.</span>
                      </div>
                      <Input 
                        placeholder="HAPUS SEMUA" 
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="border-destructive/50 focus-visible:ring-destructive/30"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Batal
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleSubmit} 
            disabled={isDeleting || !isFormValid()}
          >
            {isDeleting ? <Spinner className="mr-2 h-4 w-4" /> : <Trash2 size={16} className="mr-2" />}
            {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
