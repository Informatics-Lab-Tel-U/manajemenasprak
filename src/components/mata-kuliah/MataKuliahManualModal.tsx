/* eslint-disable react-doctor/no-chain-state-updates, react-doctor/no-cascading-set-state, react-doctor/no-effect-chain, react-doctor/rendering-hydration-no-flicker */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import TermInput from '@/components/asprak/TermInput';
import { Spinner } from '@/components/ui/spinner';
import { buildTermString } from '@/utils/termHelpers';

interface MataKuliahManualModalProps {
  open: boolean;
  onClose: () => void;
  defaultTerm: string;
  onConfirm: (data: any, term: string) => Promise<void>;
}

export default function MataKuliahManualModal({
  open,
  onClose,
  defaultTerm,
  onConfirm,
}: MataKuliahManualModalProps) {
  // Term State
  const initialYear = defaultTerm ? defaultTerm.substring(0, 2) : '25';
  const initialSem = defaultTerm && defaultTerm.endsWith('2') ? '2' : '1';
  const [termYear, setTermYear] = useState(initialYear);
  const [termSem, setTermSem] = useState<'1' | '2'>(initialSem);

  // Form State
  const [selectedPraktikumId, setSelectedPraktikumId] = useState('');
  const [newMkSingkat, setNewMkSingkat] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [prodiBase, setProdiBase] = useState('IF');
  const [dosenKoor, setDosenKoor] = useState('');
  const [warna, setWarna] = useState('#3a5edb');

  const [loading, setLoading] = useState(false);
  const [fetchingPraktikums, setFetchingPraktikums] = useState(false);
  const [localValidPraktikums, setLocalValidPraktikums] = useState<{ id: string; nama: string }[]>(
    []
  );

  // Computed Term
  const term = buildTermString(termYear, termSem);
  const isTermValid = termYear.length >= 2;

  // Fetch Praktikums when Term changes
  useEffect(() => {
    const controller = new AbortController();
    if (!open || !isTermValid) {
      setLocalValidPraktikums([]);
      return;
    }

    async function fetchPraktikums() {
      setFetchingPraktikums(true);
      try {
        // eslint-disable-next-line react-doctor/no-fetch-in-effect
        const res = await fetch(`/api/praktikum?action=by-term&term=${term}`, { signal: controller.signal });
        if (!controller.signal.aborted && res.ok) {
          const json = await res.json();
          if (json.ok && Array.isArray(json.data)) {
            setLocalValidPraktikums(json.data);
          } else {
            setLocalValidPraktikums([]);
          }
        }
      } catch (e: any) {
        if (!controller.signal.aborted) console.error(e);
      } finally {
        if (!controller.signal.aborted) setFetchingPraktikums(false);
      }
    }
    fetchPraktikums();
    // Reset selection on term change
    setSelectedPraktikumId('');

    return () => {
      controller.abort();
    };
  }, [term, open, isTermValid]);

  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTermYear(initialYear);
      setTermSem(initialSem);
      setSelectedPraktikumId('');
      setNewMkSingkat('');
      setNamaLengkap('');
      setProdiBase('IF');
      setDosenKoor('');
      setWarna('#3a5edb');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isNew = selectedPraktikumId === 'new';

      if (isNew && !newMkSingkat.trim())
        throw new Error('MK Singkat wajib diisi untuk praktikum baru');
      if (!isNew && !selectedPraktikumId) throw new Error('Pilih Praktikum');
      if (!namaLengkap.trim()) throw new Error('Nama Lengkap wajib diisi');
      if (dosenKoor.length !== 3) throw new Error('Kode Dosen harus 3 karakter');

      const program_studi = prodiBase;
      const mk_singkat = !isNew
        ? localValidPraktikums.find((p) => p.id === selectedPraktikumId)?.nama
        : newMkSingkat.toUpperCase().trim();

      await onConfirm(
        {
          mk_singkat,
          id_praktikum: isNew ? undefined : selectedPraktikumId,
          nama_lengkap: namaLengkap,
          program_studi,
          dosen_koor: dosenKoor.toUpperCase(),
          warna,
        },
        term
      );

      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Mata Kuliah Manual</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="contents">
          <FieldGroup className="p-6 pt-2">
            {/* Term Selector */}
            <TermInput
              termYear={termYear}
              termSem={termSem}
              onYearChange={setTermYear}
              onSemChange={setTermSem}
              label="Tahun Ajaran"
            />

            {/* Praktikum Selector & New Input */}
            <div className="grid grid-cols-[1fr,140px] gap-4 items-start">
              <Field>
                <FieldLabel>Pilih Praktikum</FieldLabel>
                <Select
                  value={selectedPraktikumId}
                  onValueChange={setSelectedPraktikumId}
                  disabled={!isTermValid || fetchingPraktikums}
                >
                  <SelectTrigger
                    className={
                      selectedPraktikumId === 'new' ? 'border-primary text-primary font-medium' : ''
                    }
                  >
                    <SelectValue
                      placeholder={
                        !isTermValid
                          ? 'Isi tahun dulu...'
                          : fetchingPraktikums
                            ? 'Memuat...'
                            : 'Pilih...'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="new"
                      className="text-emerald-600 font-medium focus:text-emerald-700 bg-emerald-50/50"
                    >
                      <span className="flex items-center">
                        <Plus size={14} className="mr-1" /> Buat Baru
                      </span>
                    </SelectItem>
                    {localValidPraktikums.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel
                  className={selectedPraktikumId !== 'new' ? 'text-muted-foreground' : ''}
                >
                  Kode Baru
                </FieldLabel>
                <Input
                  placeholder="Mis: ALPRO"
                  value={newMkSingkat}
                  onChange={(e) => setNewMkSingkat(e.target.value.toUpperCase())}
                  disabled={selectedPraktikumId !== 'new'}
                  className={selectedPraktikumId === 'new' ? 'border-primary bg-primary/5' : ''}
                />
              </Field>
            </div>

            {/* Nama Lengkap */}
            <Field>
              <FieldLabel>Nama Lengkap MK</FieldLabel>
              <Input
                placeholder="Contoh: Algoritma dan Pemrograman 1"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
              />
            </Field>

            {/* Prodi */}
            <Field>
              <FieldLabel>Program Studi</FieldLabel>
              <Select value={prodiBase} onValueChange={setProdiBase}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['IF', 'IF-PJJ', 'IT', 'SE', 'DS'].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Dosen Koor */}
            <Field>
              <FieldLabel>Kode Dosen Koordinator</FieldLabel>
              <Input
                placeholder="3 Huruf (misal: PEY)"
                value={dosenKoor}
                onChange={(e) => setDosenKoor(e.target.value.toUpperCase())}
                maxLength={3}
              />
              {dosenKoor.length > 0 && dosenKoor.length !== 3 && (
                <p className="text-xs text-destructive mt-1">Harus 3 karakter</p>
              )}
            </Field>

            {/* Warna */}
            <Field>
              <FieldLabel>Warna Jadwal (Opsional)</FieldLabel>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={warna}
                  onChange={(e) => setWarna(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <div className="text-sm text-muted-foreground">{warna}</div>
              </div>
            </Field>
          </FieldGroup>

          <DialogFooter className="p-6 border-t bg-muted/50">
            <Button type="button" variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Menyimpan...
                </>
              ) : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
