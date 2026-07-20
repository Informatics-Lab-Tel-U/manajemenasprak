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

export type JadwalPenggantiExportPayload = { action: 'matakuliah' | 'all' | 'current'; mata_kuliah?: string };

interface JadwalPenggantiExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: JadwalPenggantiExportPayload) => Promise<void>;
  options: string[];
  isExporting?: boolean;
}

export default function JadwalPenggantiExportDialog({
  open,
  onOpenChange,
  onConfirm,
  options,
  isExporting,
}: JadwalPenggantiExportDialogProps) {
  const [mode, setMode] = useState<'matakuliah' | 'all' | 'current'>('current');
  const [selectedMataKuliah, setSelectedMataKuliah] = useState('');

  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMode('current');
      setSelectedMataKuliah(options.length > 0 ? options[0] : '');
    }
  }

  const isFormValid = () => {
    if (mode === 'matakuliah') {
      return selectedMataKuliah !== '';
    }
    return true;
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;
    onConfirm({ action: mode, mata_kuliah: mode === 'matakuliah' ? selectedMataKuliah : undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Export Jadwal Pengganti</DialogTitle>
          <DialogDescription>
            Pilih metode ekspor data jadwal pengganti ke dalam format Excel (.xlsx).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <RadioGroup value={mode} onValueChange={(val: 'matakuliah' | 'all' | 'current') => setMode(val)}>
            <div className="flex flex-col gap-4">
              {/* Opsi Current Table */}
              <div className="flex items-start space-x-3 rounded-md border p-4">
                <RadioGroupItem value="current" id="mode-current" className="mt-1" />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="mode-current" className="font-semibold cursor-pointer">
                    Data Tabel Saat Ini
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mengekspor jadwal yang saat ini sedang tampil di layar (sesuai dengan filter yang aktif).
                  </p>
                </div>
              </div>

              {/* Opsi Mata Kuliah */}
              <div className="flex items-start space-x-3 rounded-md border p-4">
                <RadioGroupItem value="matakuliah" id="mode-matakuliah" className="mt-1" />
                <div className="space-y-2 flex-1">
                  <Label htmlFor="mode-matakuliah" className="font-semibold cursor-pointer">
                    Berdasarkan Mata Kuliah
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mengekspor seluruh jadwal pengganti dari satu mata kuliah.
                  </p>
                  {mode === 'matakuliah' && (
                    <div className="pt-2">
                      <Select value={selectedMataKuliah} onValueChange={setSelectedMataKuliah}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih mata kuliah yang akan diekspor" />
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
                    Mengunduh keseluruhan jadwal pengganti pada semester aktif.
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
            {isExporting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" /> Mengekspor...
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" /> Export Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
