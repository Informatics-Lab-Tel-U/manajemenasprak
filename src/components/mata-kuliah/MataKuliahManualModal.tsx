
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import TermInput, { buildTermString } from '@/components/asprak/TermInput';

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
  onConfirm
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
  
  const [loading, setLoading] = useState(false);
  const [fetchingPraktikums, setFetchingPraktikums] = useState(false);
  const [localValidPraktikums, setLocalValidPraktikums] = useState<{id: string, nama: string}[]>([]);

  // Computed Term
  const term = buildTermString(termYear, termSem);
  const isTermValid = termYear.length >= 2;

  // Fetch Praktikums when Term changes
  useEffect(() => {
    if (!open || !isTermValid) {
        setLocalValidPraktikums([]);
        return;
    }
    
    let active = true;
    async function fetchPraktikums() {
        setFetchingPraktikums(true);
        try {
            const res = await fetch(`/api/praktikum?action=by-term&term=${term}`);
            if (active && res.ok) {
                const json = await res.json();
                if (json.ok && Array.isArray(json.data)) {
                    setLocalValidPraktikums(json.data);
                } else {
                    setLocalValidPraktikums([]);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (active) setFetchingPraktikums(false);
        }
    }
    fetchPraktikums();
    // Reset selection on term change
    setSelectedPraktikumId('');
    
    return () => { active = false; };
  }, [term, open, isTermValid]);

  // Reset form on open
  useEffect(() => {
    if (open) {
      setTermYear(initialYear);
      setTermSem(initialSem);
      setSelectedPraktikumId('');
      setNewMkSingkat('');
      setNamaLengkap('');
      setProdiBase('IF');
      setDosenKoor('');
    }
  }, [open, initialYear, initialSem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isNew = selectedPraktikumId === 'new';

      if (isNew && !newMkSingkat.trim()) throw new Error('MK Singkat wajib diisi untuk praktikum baru');
      if (!isNew && !selectedPraktikumId) throw new Error('Pilih Praktikum');
      if (!namaLengkap.trim()) throw new Error('Nama Lengkap wajib diisi');
      if (dosenKoor.length !== 3) throw new Error('Kode Dosen harus 3 karakter');

      const program_studi = prodiBase;
      const mk_singkat = !isNew
        ? localValidPraktikums.find(p => p.id === selectedPraktikumId)?.nama 
        : newMkSingkat.toUpperCase().trim();

      await onConfirm({
        mk_singkat, 
        id_praktikum: isNew ? undefined : selectedPraktikumId,
        nama_lengkap: namaLengkap, 
        program_studi,
        dosen_koor: dosenKoor.toUpperCase()
      }, term);
      
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
                    <SelectTrigger className={selectedPraktikumId === 'new' ? 'border-primary text-primary font-medium' : ''}>
                      <SelectValue placeholder={
                          !isTermValid ? "Isi tahun dulu..." : 
                          fetchingPraktikums ? "Memuat..." : 
                          "Pilih..."
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new" className="text-emerald-600 font-medium focus:text-emerald-700 bg-emerald-50/50">
                          <span className="flex items-center">
                              <Plus size={14} className="mr-1" /> Buat Baru
                          </span>
                      </SelectItem>
                      {localValidPraktikums.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </Field>

               <Field>
                <FieldLabel className={selectedPraktikumId !== 'new' ? 'text-muted-foreground' : ''}>Kode Baru</FieldLabel>
                <Input 
                   placeholder="Mis: ALPRO"
                   value={newMkSingkat}
                   onChange={e => setNewMkSingkat(e.target.value.toUpperCase())}
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
                onChange={e => setNamaLengkap(e.target.value)}
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
                  {['IF', 'IF-PJJ', 'IT', 'SE', 'DS'].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
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
                onChange={e => setDosenKoor(e.target.value.toUpperCase())}
                maxLength={3}
              />
              {dosenKoor.length > 0 && dosenKoor.length !== 3 && (
                  <p className="text-xs text-destructive mt-1">Harus 3 karakter</p>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter className="p-6 border-t bg-muted/50">
            <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
