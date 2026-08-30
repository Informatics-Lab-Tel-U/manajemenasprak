import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Users, FileSpreadsheet } from 'lucide-react';
import { PresensiFormOptions } from '@/types/presensi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OptionsTogglesProps {
  opsi: PresensiFormOptions;
  setOpsi: (val: PresensiFormOptions) => void;
  /** Apakah sheet REKAP & ASPRAK BELUM NILAI akan di-generate */
  generateRekapSheet: boolean;
  onToggleRekapSheet: (val: boolean) => void;
  /** Jumlah asprak yang terdeteksi dari praktikum yang dipilih */
  asprakCount: number;
  /** Loading state saat fetch asprak */
  loadingAsprak: boolean;
  /** Apakah praktikum sudah dipilih */
  hasPraktikum: boolean;
}

export function OptionsToggles({
  opsi,
  setOpsi,
  generateRekapSheet,
  onToggleRekapSheet,
  asprakCount,
  loadingAsprak,
  hasPraktikum,
}: OptionsTogglesProps) {
  const canGenerateRekap = hasPraktikum;

  return (
    <div className="space-y-6">
      {/* ── Kolom Penilaian ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TP */}
        <div className={`p-4 rounded-xl border transition-colors ${opsi.tp.enabled ? 'bg-card border-primary/40 shadow-sm' : 'bg-muted/20 border-border/50 opacity-80'}`}>
          <div className="flex items-center space-x-2.5">
            <Checkbox
              id="opsi-tp"
              checked={opsi.tp.enabled}
              onCheckedChange={(checked) => setOpsi({ ...opsi, tp: { ...opsi.tp, enabled: checked === true } })}
            />
            <Label htmlFor="opsi-tp" className="font-semibold text-sm cursor-pointer">
              Tugas Pendahuluan
            </Label>
          </div>
          {opsi.tp.enabled && (
            <div className="mt-3.5 pt-3 border-t border-border/40 space-y-2">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Tipe Penilaian</span>
                <Select
                  value={opsi.tp.inputType}
                  onValueChange={(val) => setOpsi({ ...opsi, tp: { ...opsi.tp, inputType: val as 'number' | 'boolean' } })}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Tipe Input" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Angka (0-100)</SelectItem>
                    <SelectItem value="boolean">YA / TIDAK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {opsi.tp.inputType === 'number' && (
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Bobot Nilai (%)</span>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={opsi.tp.weight}
                      onChange={(e) => setOpsi({ ...opsi, tp: { ...opsi.tp, weight: Number(e.target.value) } })}
                      className="h-8 text-xs font-mono"
                      aria-label="Bobot TP"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">%</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Jurnal */}
        <div className={`p-4 rounded-xl border transition-colors ${opsi.jurnal.enabled ? 'bg-card border-primary/40 shadow-sm' : 'bg-muted/20 border-border/50 opacity-80'}`}>
          <div className="flex items-center space-x-2.5">
            <Checkbox
              id="opsi-jurnal"
              checked={opsi.jurnal.enabled}
              onCheckedChange={(checked) => setOpsi({ ...opsi, jurnal: { ...opsi.jurnal, enabled: checked === true } })}
            />
            <Label htmlFor="opsi-jurnal" className="font-semibold text-sm cursor-pointer">
              Jurnal / Test Awal
            </Label>
          </div>
          {opsi.jurnal.enabled && (
            <div className="mt-3.5 pt-3 border-t border-border/40 space-y-2">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Tipe Penilaian</span>
                <Select
                  value={opsi.jurnal.inputType}
                  onValueChange={(val) => setOpsi({ ...opsi, jurnal: { ...opsi.jurnal, inputType: val as 'number' | 'boolean' } })}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Tipe Input" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Angka (0-100)</SelectItem>
                    <SelectItem value="boolean">YA / TIDAK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {opsi.jurnal.inputType === 'number' && (
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Bobot Nilai (%)</span>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={opsi.jurnal.weight}
                      onChange={(e) => setOpsi({ ...opsi, jurnal: { ...opsi.jurnal, weight: Number(e.target.value) } })}
                      className="h-8 text-xs font-mono"
                      aria-label="Bobot Jurnal"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">%</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tes Akhir */}
        <div className={`p-4 rounded-xl border transition-colors ${opsi.tesAkhir.enabled ? 'bg-card border-primary/40 shadow-sm' : 'bg-muted/20 border-border/50 opacity-80'}`}>
          <div className="flex items-center space-x-2.5">
            <Checkbox
              id="opsi-tesAkhir"
              checked={opsi.tesAkhir.enabled}
              onCheckedChange={(checked) => setOpsi({ ...opsi, tesAkhir: { ...opsi.tesAkhir, enabled: checked === true } })}
            />
            <Label htmlFor="opsi-tesAkhir" className="font-semibold text-sm cursor-pointer">
              Tes Akhir
            </Label>
          </div>
          {opsi.tesAkhir.enabled && (
            <div className="mt-3.5 pt-3 border-t border-border/40 space-y-2">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Tipe Penilaian</span>
                <Select
                  value={opsi.tesAkhir.inputType}
                  onValueChange={(val) => setOpsi({ ...opsi, tesAkhir: { ...opsi.tesAkhir, inputType: val as 'number' | 'boolean' } })}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Tipe Input" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Angka (0-100)</SelectItem>
                    <SelectItem value="boolean">YA / TIDAK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {opsi.tesAkhir.inputType === 'number' && (
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">Bobot Nilai (%)</span>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={opsi.tesAkhir.weight}
                      onChange={(e) => setOpsi({ ...opsi, tesAkhir: { ...opsi.tesAkhir, weight: Number(e.target.value) } })}
                      className="h-8 text-xs font-mono"
                      aria-label="Bobot Tes Akhir"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">%</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rate Asprak */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${opsi.rate ? 'bg-card border-primary/40 shadow-sm' : 'bg-muted/20 border-border/50 opacity-80'}`}>
          <div className="flex items-center space-x-2.5">
            <Checkbox
              id="opsi-rate"
              checked={opsi.rate}
              onCheckedChange={(checked) => setOpsi({ ...opsi, rate: checked === true })}
            />
            <Label htmlFor="opsi-rate" className="font-semibold text-sm cursor-pointer">
              Rate Asprak
            </Label>
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            Menyediakan kolom rating/umpan balik dari praktikan kepada asisten praktikum per modul.
          </p>
        </div>
      </div>

      {/* ── Toggle Sheet Rekap ────────────────────────────────────── */}
      <div className="p-4 rounded-xl border border-border/50 bg-muted/20 flex items-start space-x-3.5">
        <Checkbox
          id="opsi-rekap"
          checked={generateRekapSheet}
          disabled={!canGenerateRekap}
          onCheckedChange={(checked) => onToggleRekapSheet(checked === true)}
          className="mt-1"
        />
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Label
              htmlFor="opsi-rekap"
              className={`font-semibold text-sm cursor-pointer flex items-center gap-1.5 ${!canGenerateRekap ? 'text-muted-foreground' : ''}`}
            >
              <FileSpreadsheet className="size-4 text-primary" />
              Generate Sheet Rekapitulasi & Asprak Belum Nilai
            </Label>
            {/* Status badge */}
            {loadingAsprak ? (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Memuat asprak...
              </Badge>
            ) : !hasPraktikum ? (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Pilih praktikum dulu
              </Badge>
            ) : asprakCount > 0 ? (
              <Badge variant="secondary" className="text-xs flex items-center gap-1 font-mono">
                <Users className="h-3 w-3" />
                {asprakCount} asprak
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Daftar asprak kosong
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Menambahkan 2 sheet otomatis: <strong>ASPRAK BELUM NILAI</strong> (tabel asisten yang belum menginput nilai) dan <strong>REKAP</strong> nilai akhir praktikan.
          </p>
        </div>
      </div>
    </div>
  );
}
