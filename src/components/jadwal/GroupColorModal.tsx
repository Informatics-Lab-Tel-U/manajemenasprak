'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { MataKuliah } from '@/types/database';
import { toast } from 'sonner';

interface GroupColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mataKuliahList: MataKuliah[];
}

export function GroupColorModal({ isOpen, onClose, mataKuliahList }: GroupColorModalProps) {
  const [loading, setLoading] = useState(false);
  const [colors, setColors] = useState<Record<string, string>>({});

  // Group by Praktikum (Mata Kuliah Prefix)
  const uniqueGroups = Array.from(
    new Set(
      mataKuliahList
        .map((mk) => mk.praktikum?.nama)
        .filter(Boolean) as string[]
    )
  ).sort();

  useEffect(() => {
    if (isOpen) {
      // Initialize colors based on existing Mks
      const initialColors: Record<string, string> = {};
      uniqueGroups.forEach((groupName) => {
        // Find the first MK in this group that has a color set
        const mkWithColor = mataKuliahList.find(
          (mk) => mk.praktikum?.nama === groupName && mk.warna
        );
        // Default to a default color if not set (or we can just leave empty to indicate default hash will be used)
        initialColors[groupName] = mkWithColor?.warna || '#3a5edb'; // Standard blue fallback for picker initialization
      });
      setColors(initialColors);
    }
  }, [isOpen, mataKuliahList]); // uniqueGroups is derived from mataKuliahList so depends on it

  const handleColorChange = (groupName: string, color: string) => {
    setColors((prev) => ({ ...prev, [groupName]: color }));
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      // Build an array of all MKs that need updating
      const updates: { id: string; warna: string }[] = [];

      uniqueGroups.forEach((groupName) => {
        const color = colors[groupName];
        if (color) {
          const mksInGroup = mataKuliahList.filter((mk) => mk.praktikum?.nama === groupName);
          mksInGroup.forEach((mk) => {
            if (mk.warna !== color) {
              updates.push({ id: mk.id, warna: color });
            }
          });
        }
      });

      if (updates.length === 0) {
        toast.info('Tidak ada perubahan warna untuk disimpan.');
        onClose();
        return;
      }

      const res = await fetch('/api/mata-kuliah', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk-update-color', data: updates }),
      });

      const result = await res.json();
      if (!res.ok || !result.ok) {
        throw new Error(result.error || 'Gagal menyimpan perubahan warna');
      }

      toast.success('Warna berhasil diperbarui untuk semua grup.');
      // Refresh the page to reload the main jadwal context
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pengaturan Warna Grup Praktikum</DialogTitle>
        </DialogHeader>

        <div className="py-4 max-h-[60vh] overflow-y-auto space-y-4">
          {uniqueGroups.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">
              Tidak ada data grup praktikum ditemukan.
            </p>
          ) : (
            uniqueGroups.map((groupName) => (
              <div key={groupName} className="flex items-center justify-between">
                <Label className="text-sm font-medium">{groupName}</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={colors[groupName] || '#3a5edb'}
                    onChange={(e) => handleColorChange(groupName, e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground w-16 text-right font-mono">
                    {colors[groupName]?.toUpperCase() || '#3A5EDB'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={loading || uniqueGroups.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
