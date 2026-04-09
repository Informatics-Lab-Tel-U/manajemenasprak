import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { fetchAllAsprak } from '@/lib/fetchers/asprakFetcher';
import { addJadwalJaga } from '@/lib/fetchers/jagaFetcher';
import { Asprak } from '@/types/database';
import { canInputJagaForModul, getJagaShiftsByDay } from '@/utils/jagaUtils';
import { AlertCircle, Check, ChevronsUpDown, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface JagaInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  term: string;
  selectedModul: number;
  konfigurasiModul: { modul: number, tanggal_mulai: string | null }[];
  defaultDay: string;
  userRole?: string;
  onSuccess: () => void;
}

export default function JagaInputModal({
  isOpen,
  onClose,
  term,
  selectedModul,
  konfigurasiModul,
  defaultDay,
  userRole = 'ASPRAK',
  onSuccess,
}: JagaInputModalProps) {
  const [loading, setLoading] = useState(false);
  const [asprakList, setAsprakList] = useState<Asprak[]>([]);
  
  const [selectedAsprakId, setSelectedAsprakId] = useState('');
  const [selectedHari, setSelectedHari] = useState(defaultDay);
  const [selectedShift, setSelectedShift] = useState('');

  const [openAsprak, setOpenAsprak] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [canInput, setCanInput] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadDependencies = async () => {
    setLoading(true);
    const supabase = createClient();
    
    // Check validity using the passed userRole
    const allowed = canInputJagaForModul(selectedModul, konfigurasiModul, userRole);
    setCanInput(allowed);

    // Fetch asprak
    const { data } = await fetchAllAsprak(term);
    if (data) {
      // Sort ASLAB first, then ASPRAK, then by Kode
      const sorted = [...data].sort((a, b) => {
        if (a.role === 'ASLAB' && b.role !== 'ASLAB') return -1;
        if (a.role !== 'ASLAB' && b.role === 'ASLAB') return 1;
        return a.kode.localeCompare(b.kode);
      });
      setAsprakList(sorted);
    }
    
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedAsprakId || !selectedHari || !selectedShift) {
      toast.error('Harap lengkapi semua data form');
      return;
    }

    setLoading(true);
    const { success, error } = await addJadwalJaga({
      id_asprak: selectedAsprakId,
      tahun_ajaran: term,
      modul: selectedModul,
      hari: selectedHari,
      shift: parseInt(selectedShift),
    });

    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }

    toast.success('Jadwal jaga berhasil ditambahkan');
    setLoading(false);
    onSuccess();
    onClose();
  };

  const currentShifts = getJagaShiftsByDay(selectedHari);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Input Jadwal Jaga</DialogTitle>
          <DialogDescription>
            Menambahkan status jaga untuk Modul {selectedModul}
          </DialogDescription>
        </DialogHeader>

        {!canInput ? (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Tidak Diizinkan</AlertTitle>
            <AlertDescription>
              Input jaga untuk Modul {selectedModul} baru bisa dilakukan mulai hari Sabtu minggu sebelumnya.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="asprak">Pilih ASLAB / ASPRAK</Label>
              <Popover open={openAsprak} onOpenChange={setOpenAsprak}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openAsprak}
                    className="w-full justify-between px-3 font-normal"
                    disabled={loading}
                  >
                    {selectedAsprakId
                      ? (() => {
                          const selected = asprakList.find((a) => a.id === selectedAsprakId);
                          return selected ? `[${selected.kode}] - ${selected.nama_lengkap} (${selected.role})` : '-- Pilih Asisten --';
                        })()
                      : '-- Pilih Asisten --'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[375px] p-0" align="start">
                  <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                      className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Cari Asisten (Kode / Nama)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-64">
                    <div className="p-1">
                      {asprakList
                        .filter((a) =>
                          `${a.kode} ${a.nama_lengkap}`.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((a) => (
                          <div
                            key={a.id}
                            role="option"
                            aria-selected={selectedAsprakId === a.id}
                            className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors"
                            onClick={() => {
                              setSelectedAsprakId(a.id);
                              setOpenAsprak(false);
                              setSearchQuery('');
                            }}
                          >
                            {selectedAsprakId === a.id && (
                              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                <Check className="h-4 w-4" />
                              </span>
                            )}
                            <span className="truncate">
                              [{a.kode}] - {a.nama_lengkap} ({a.role})
                            </span>
                          </div>
                        ))}
                      {asprakList.filter((a) =>
                        `${a.kode} ${a.nama_lengkap}`.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          Asisten tidak ditemukan.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="hari">Hari</Label>
              <Select 
                value={selectedHari} 
                onValueChange={(val) => {
                  setSelectedHari(val);
                  setSelectedShift(''); // reset shift on day change
                }} 
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'].map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="shift">Pilih Sesi Jam (Shift)</Label>
              <Select value={selectedShift} onValueChange={setSelectedShift} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Pilih Sesi --" />
                </SelectTrigger>
                <SelectContent>
                  {currentShifts.map((s) => (
                    <SelectItem key={s.shift} value={s.shift.toString()}>
                      {s.jam} (Shift {s.shift})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSubmit} disabled={loading || !canInput}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
