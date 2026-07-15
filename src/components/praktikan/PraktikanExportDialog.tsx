'use client';

import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
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

export type ExportPayload = { action: 'kelas' | 'all' | 'current'; kelas?: string };

interface PraktikanExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: ExportPayload) => Promise<void>;
  options: string[];
  isExporting?: boolean;
}

export default function PraktikanExportDialog({
  open,
  onOpenChange,
  onConfirm,
  options,
  isExporting,
}: PraktikanExportDialogProps) {
  const [mode, setMode] = useState<'kelas' | 'all' | 'current'>('current');
  const [selectedKelas, setSelectedKelas] = useState('');

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setMode('current');
      setSelectedKelas(options.length > 0 ? options[0] : '');
    }
  }, [open, options]);

  const isFormValid = () => {
    if (mode === 'kelas') {
      return selectedKelas !== '';
    }
    return true;
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;
    onConfirm({ action: mode, kelas: mode === 'kelas' ? selectedKelas : undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Export Data Praktikan</DialogTitle>
          <DialogDescription>
            Pilih metode ekspor data ke dalam format Excel (.xlsx).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <RadioGroup value={mode} onValueChange={(val: 'kelas' | 'all' | 'current') => setMode(val)}>
            <div className="flex flex-col gap-4">
              {/* Opsi Current Table */}
              <div className="flex items-start space-x-3 rounded-md border p-4">
                <RadioGroupItem value="current" id="mode-current" className="mt-1" />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="mode-current" className="font-semibold cursor-pointer">
                    Data Tabel Saat Ini
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mengekspor data praktikan yang saat ini sedang tampil di layar (sesuai dengan filter yang aktif).
                  </p>
                </div>
              </div>

              {/* Opsi Kelas */}
              <div className="flex items-start space-x-3 rounded-md border p-4">
                <RadioGroupItem value="kelas" id="mode-kelas" className="mt-1" />
                <div className="space-y-2 flex-1">
                  <Label htmlFor="mode-kelas" className="font-semibold cursor-pointer">
                    Berdasarkan Kelas
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mengekspor seluruh praktikan dari satu kelas secara utuh langsung dari database.
                  </p>
                  {mode === 'kelas' && (
                    <div className="pt-2">
                      <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kelas yang akan diekspor" />
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
                <div className="space-y-1 flex-1">
                  <Label htmlFor="mode-all" className="font-semibold cursor-pointer">
                    Seluruh Data
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mengunduh keseluruhan data praktikan yang ada di sistem tanpa terkecuali.
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Batal
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isExporting || !isFormValid()}
          >
            {isExporting ? <Spinner className="mr-2 h-4 w-4" /> : <Download size={16} className="mr-2" />}
            {isExporting ? 'Mengekspor...' : 'Export Excel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
