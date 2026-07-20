import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X } from 'lucide-react';

interface KelasManagerProps {
  loadingKelas: boolean;
  kelasNames: string[];
  handleRemoveKelas: (idx: number) => void;
  customKelasInput: string;
  setCustomKelasInput: (val: string) => void;
  handleAddCustomKelas: () => void;
}

export function KelasManager({
  loadingKelas,
  kelasNames,
  handleRemoveKelas,
  customKelasInput,
  setCustomKelasInput,
  handleAddCustomKelas,
}: KelasManagerProps) {
  return (
    <div className="space-y-4 sm:col-span-2">
      <div className="space-y-2">
        <Label>Daftar Kelas Tersedia</Label>
        <div className="min-h-9 px-3 py-2 flex flex-wrap items-center gap-2 border rounded-md bg-muted/30 text-sm overflow-hidden">
          {loadingKelas ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : kelasNames.length > 0 ? (
            kelasNames.map((kelas, idx) => (
              <Badge key={kelas} variant="secondary" className="flex items-center gap-1">
                {kelas}
                <button
                  type="button"
                  onClick={() => handleRemoveKelas(idx)}
                  className="hover:text-destructive"
                  aria-label={`Hapus kelas ${kelas}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground">Belum ada kelas</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customKelas">Tambah Kelas Manual (bisa dipisah koma)</Label>
        <div className="flex gap-2">
          <Input
            id="customKelas"
            value={customKelasInput}
            onChange={(e) => setCustomKelasInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomKelas()}
            placeholder="Misal: TI-46-01, TI-46-02"
          />
          <Button variant="secondary" onClick={handleAddCustomKelas}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
