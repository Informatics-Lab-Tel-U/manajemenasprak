'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, PaintBucket } from 'lucide-react';
import { MataKuliah } from '@/types/database';
import { toast } from 'sonner';
import { COURSE_COLORS } from '@/utils/colorUtils';
import { cn } from '@/lib/utils';

interface GroupColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mataKuliahList: MataKuliah[];
}

/**
 * Helper to determine contrast color (Black/White) locally to ensure stability
 */
const getContrastColor = (hex: string) => {
  if (!hex) return '#ffffff';
  const color = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
};

export function GroupColorModal({ isOpen, onClose, mataKuliahList }: GroupColorModalProps) {
  const [loading, setLoading] = useState(false);
  const [colors, setColors] = useState<Record<string, string>>({});
  const [initialColors, setInitialColors] = useState<Record<string, string>>({});

  // Group by Praktikum Name globally
  const uniqueGroups = useMemo(() => Array.from(
    new Set(
      mataKuliahList
        .map((mk) => mk.praktikum?.nama)
        .filter(Boolean) as string[]
    )
  ).sort(), [mataKuliahList]);

  useEffect(() => {
    if (isOpen) {
      const dbColors: Record<string, string> = {};
      uniqueGroups.forEach((groupName) => {
        // Find any MK in this group (across all terms) that has a color
        const mkWithColor = mataKuliahList.find(
          (mk) => mk.praktikum?.nama === groupName && mk.warna
        );
        dbColors[groupName] = mkWithColor?.warna || '#3a5edb';
      });
      setColors(dbColors);
      setInitialColors(dbColors);
    }
  }, [isOpen, mataKuliahList, uniqueGroups]);

  const handleColorChange = (groupName: string, color: string) => {
    setColors((prev) => ({ ...prev, [groupName]: color }));
  };

  const hasChanges = Object.keys(colors).some(
    (key) => colors[key] !== initialColors[key]
  );

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      // Build global updates
      const updates = uniqueGroups
        .filter((name) => colors[name] !== initialColors[name])
        .map((name) => ({ nama: name, warna: colors[name] }));

      const res = await fetch('/api/mata-kuliah', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk-update-global-color', data: updates }),
      });

      const result = await res.json();
      if (!res.ok || !result.ok) {
        throw new Error(result.error || 'Gagal menyimpan perubahan warna global');
      }

      toast.success(`Berhasil memperbarui ${result.data?.updated} entri jadwal secara global.`);
      onClose();
      window.location.reload();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>Pengaturan Warna Grup</DialogTitle>
          <DialogDescription>
            Pilih warna untuk setiap grup praktikum secara global.
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[60vh]">
          {/* Left Column: Scrollable Color Picker List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {uniqueGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <PaintBucket size={32} className="mb-2 opacity-20" />
                <p className="text-sm">Tidak ada grup praktikum ditemukan.</p>
              </div>
            ) : (
              uniqueGroups.map((groupName) => {
                const currentColor = colors[groupName] || '#3a5edb';
                const contrastColor = getContrastColor(currentColor);
                const isCustom = !COURSE_COLORS.some(
                  (c) => c.toLowerCase() === currentColor.toLowerCase()
                );
                const isChanged = currentColor !== initialColors[groupName];

                return (
                  <div 
                    key={groupName} 
                    className={cn(
                      "p-4 rounded-lg border transition-colors",
                      isChanged ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm"
                          style={{ 
                            backgroundColor: currentColor,
                            color: contrastColor,
                          }}
                        >
                          {groupName}
                        </div>
                        {isChanged && (
                          <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            MODIFIED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isCustom && (
                          <span className="text-[10px] text-muted-foreground font-medium bg-background px-1.5 py-0.5 rounded border">
                            Custom
                          </span>
                        )}
                        <div className="flex items-center gap-2 bg-background border px-2 py-1 rounded-md">
                          <input
                            type="color"
                            value={currentColor}
                            onChange={(e) => handleColorChange(groupName, e.target.value)}
                            className="w-4 h-4 p-0 border-0 cursor-pointer bg-transparent"
                          />
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {currentColor}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-9 gap-1.5">
                      {COURSE_COLORS.map((color) => {
                        const isSelected = currentColor.toLowerCase() === color.toLowerCase();
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => handleColorChange(groupName, color)}
                            className={cn(
                              "relative aspect-square rounded-sm border transition-all hover:scale-105",
                              isSelected 
                                ? "border-primary ring-1 ring-primary ring-offset-1" 
                                : "border-transparent"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Color Overview Sidebar */}
          <div className="w-[240px] border-l bg-muted/10 p-6 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Overview Warna
            </h3>
            <div className="space-y-2">
              {uniqueGroups.map((groupName) => {
                const currentColor = colors[groupName] || '#3a5edb';
                const isChanged = currentColor !== initialColors[groupName];
                
                return (
                  <div key={`ov-${groupName}`} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div 
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-black/5" 
                        style={{ backgroundColor: currentColor }} 
                      />
                      <span className={cn(
                        "text-xs truncate transition-colors",
                        isChanged ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {groupName}
                      </span>
                    </div>
                    {isChanged && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 ml-2" title="Modified" />
                    )}
                  </div>
                );
              })}
            </div>
            
            {hasChanges && (
              <div className="mt-8 flex items-center gap-2.5 px-1 animate-in fade-in slide-in-from-bottom-2">
                <div className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Belum Disimpan
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-muted/20">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || uniqueGroups.length === 0 || !hasChanges}
            className="px-8"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </Dialog>
  );
}
