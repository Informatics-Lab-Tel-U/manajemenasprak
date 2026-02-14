
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Asprak } from '@/types/database';
import { usePraktikum } from '@/hooks/usePraktikum';
import { Praktikum } from '@/types/database';

interface AsprakEditModalProps {
  asprak: Asprak;
  term: string; // The term being edited (e.g. "2425-2")
  assignments: string[]; // List of praktikum IDs currently assigned
  onSave: (praktikumIds: string[]) => Promise<void>;
  onClose: () => void;
  open: boolean;
}

export default function AsprakEditModal({
  asprak,
  term,
  assignments,
  onSave,
  onClose,
  open,
}: AsprakEditModalProps) {
  const { getPraktikumByTerm, loading: loadingPraktikum } = usePraktikum();
  const [availablePraktikums, setAvailablePraktikums] = useState<Praktikum[]>([]);
  const [selectedPraktikumIds, setSelectedPraktikumIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && term) {
      // Load available praktikum for this term
      getPraktikumByTerm(term).then((data) => {
        setAvailablePraktikums(data);
      });
      // Initialize selection
      setSelectedPraktikumIds(assignments);
    }
  }, [open, term, assignments]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(selectedPraktikumIds);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Penugasan Asisten</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
                <Label className="text-muted-foreground text-xs">NIM</Label>
                <div className="font-medium">{asprak.nim}</div>
             </div>
             <div>
                <Label className="text-muted-foreground text-xs">Kode</Label>
                <div className="font-medium font-mono">{asprak.kode}</div>
             </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Nama Lengkap</Label>
            <div className="font-medium">{asprak.nama_lengkap}</div>
          </div>

          <div className="border-t pt-4 mt-2">
            <Label className="mb-3 block">
              Praktikum Term <span className="font-bold text-primary">{term}</span>
            </Label>
            
            {loadingPraktikum ? (
                 <div className="text-sm text-muted-foreground">Loading praktikum...</div>
            ) : availablePraktikums.length === 0 ? (
                <div className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded">
                    Tidak ada data praktikum untuk term ini.
                </div>
            ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto border rounded-md p-3">
                  {availablePraktikums.map((p) => (
                    <div key={p.id} className="flex items-start space-x-2">
                      <Checkbox 
                        id={p.id} 
                        checked={selectedPraktikumIds.includes(p.id)}
                        onCheckedChange={(c) => handleToggle(p.id, !!c)}
                      />
                      <div className="grid gap-1.5 leading-none">
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
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
