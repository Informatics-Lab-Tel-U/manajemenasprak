import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Asprak, Praktikum } from '@/types/database';
import { usePraktikum } from '@/hooks/usePraktikum';

interface AsprakEditModalProps {
  asprak: Asprak;
  term: string; // The term being edited or 'all'
  assignments: string[]; // List of praktikum IDs currently assigned
  onSave: (praktikumIds: string[], newKode: string) => Promise<void>;
  onClose: () => void;
  open: boolean;
}

export default function AsprakEditModal({
  asprak,
  assignments,
  onSave,
  onClose,
  open,
}: AsprakEditModalProps) {
  const { getPraktikumByTerm, loading: loadingPraktikum } = usePraktikum();
  const [availablePraktikums, setAvailablePraktikums] = useState<Praktikum[]>([]);
  const [selectedPraktikumIds, setSelectedPraktikumIds] = useState<string[]>([]);
  const [newKode, setNewKode] = useState<string>(asprak.kode);
  const [kodeError, setKodeError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // Always fetch ALL praktikums to allow cross-term editing
      getPraktikumByTerm('all').then((data) => {
        setAvailablePraktikums(data);
      });
      // Initialize selection
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPraktikumIds(assignments);
      setNewKode(asprak.kode);
      setKodeError(null);
    }
  }, [open, getPraktikumByTerm, assignments, asprak.kode]);

  const handleSave = async () => {
    if (newKode.length !== 3) {
      setKodeError('Kode Asisten harus persis 3 huruf');
      return;
    }

    setSaving(true);
    await onSave(selectedPraktikumIds, newKode.toUpperCase());
    setSaving(false);
    onClose();
  };

  const handleToggle = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedPraktikumIds((prev) => [...prev, id]);
    } else {
      setSelectedPraktikumIds((prev) => prev.filter((pId) => pId !== id));
    }
  };

  // Group praktikums by term
  const groupedPraktikums = useMemo(() => {
    const groups: Record<string, Praktikum[]> = {};
    availablePraktikums.forEach((p) => {
      if (!groups[p.tahun_ajaran]) {
        groups[p.tahun_ajaran] = [];
      }
      groups[p.tahun_ajaran].push(p);
    });
    // Sort terms descending (latest first)
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [availablePraktikums]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Edit Penugasan Asisten</DialogTitle>
          <DialogDescription className="sr-only">
            Edit penugasan asisten praktikum.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 grid gap-4 shrink-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">NIM</Label>
              <div className="font-medium">{asprak.nim}</div>
            </div>
            <div>
              <Label htmlFor="kode" className="text-muted-foreground text-xs">
                Kode
              </Label>
              <Input
                id="kode"
                value={newKode}
                onChange={(e) => {
                  setNewKode(e.target.value.toUpperCase().slice(0, 3));
                  setKodeError(null);
                }}
                className={`font-mono uppercase transition-colors h-8 ${
                  kodeError ? 'border-red-500 focus-visible:ring-red-500' : ''
                }`}
                placeholder="ABC"
                maxLength={3}
              />
              {kodeError && <p className="text-red-500 text-xs mt-1">{kodeError}</p>}
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Nama Lengkap</Label>
            <div className="font-medium">{asprak.nama_lengkap}</div>
          </div>
        </div>

        <div className="px-6 py-2 flex-1 overflow-y-auto min-h-0 border-t">
          {loadingPraktikum ? (
            <div className="text-sm text-muted-foreground py-4">Memuat praktikum...</div>
          ) : availablePraktikums.length === 0 ? (
            <div className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded my-2">
              Tidak ada data praktikum.
            </div>
          ) : (
            <div className="space-y-6 pt-2 pb-4">
              {groupedPraktikums.map(([termKey, praktikums]) => (
                <div key={termKey} className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground bg-muted/40 px-2 py-1 rounded">
                    Term {termKey}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                    {praktikums.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-start space-x-2 border p-2 rounded hover:bg-muted/10 transition-colors"
                      >
                        <Checkbox
                          id={p.id}
                          checked={selectedPraktikumIds.includes(p.id)}
                          onCheckedChange={(c) => handleToggle(p.id, !!c)}
                        />
                        <div className="grid gap-1.5 leading-none pt-0.5">
                          <label
                            htmlFor={p.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {p.nama}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t mt-auto">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
