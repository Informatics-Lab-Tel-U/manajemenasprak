import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users } from 'lucide-react';
import { PresensiFormOptions } from '@/hooks/usePresensiForm';
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
  const canGenerateRekap = hasPraktikum && asprakCount > 0;

  return (
    <div className="space-y-6">
      {/* ── Kolom Penilaian ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-8">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="opsi-tp"
            checked={opsi.tp.enabled}
            onCheckedChange={(checked) => setOpsi({ ...opsi, tp: { ...opsi.tp, enabled: checked === true } })}
          />
          <Label htmlFor="opsi-tp" className="font-medium cursor-pointer">
            Tugas Pendahuluan (TP)
          </Label>
          {opsi.tp.enabled && (
            <div className="flex items-center space-x-2 ml-2">
              <Select
                value={opsi.tp.inputType}
                onValueChange={(val) => setOpsi({ ...opsi, tp: { ...opsi.tp, inputType: val as 'number' | 'boolean' } })}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Tipe Input" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Tipe: Angka (%)</SelectItem>
                  <SelectItem value="boolean">Tipe: YA / TIDAK</SelectItem>
                </SelectContent>
              </Select>
              {opsi.tp.inputType === 'number' && (
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={opsi.tp.weight}
                    onChange={(e) => setOpsi({ ...opsi, tp: { ...opsi.tp, weight: Number(e.target.value) } })}
                    className="w-16 px-2 py-1 text-sm border rounded-md"
                    aria-label="Bobot TP"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="opsi-jurnal"
            checked={opsi.jurnal.enabled}
            onCheckedChange={(checked) => setOpsi({ ...opsi, jurnal: { ...opsi.jurnal, enabled: checked === true } })}
          />
          <Label htmlFor="opsi-jurnal" className="font-medium cursor-pointer">
            Jurnal / Test Awal
          </Label>
          {opsi.jurnal.enabled && (
            <div className="flex items-center space-x-2 ml-2">
              <Select
                value={opsi.jurnal.inputType}
                onValueChange={(val) => setOpsi({ ...opsi, jurnal: { ...opsi.jurnal, inputType: val as 'number' | 'boolean' } })}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Tipe Input" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Tipe: Angka (%)</SelectItem>
                  <SelectItem value="boolean">Tipe: YA / TIDAK</SelectItem>
                </SelectContent>
              </Select>
              {opsi.jurnal.inputType === 'number' && (
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={opsi.jurnal.weight}
                    onChange={(e) => setOpsi({ ...opsi, jurnal: { ...opsi.jurnal, weight: Number(e.target.value) } })}
                    className="w-16 px-2 py-1 text-sm border rounded-md"
                    aria-label="Bobot Jurnal"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="opsi-tesAkhir"
            checked={opsi.tesAkhir.enabled}
            onCheckedChange={(checked) => setOpsi({ ...opsi, tesAkhir: { ...opsi.tesAkhir, enabled: checked === true } })}
          />
          <Label htmlFor="opsi-tesAkhir" className="font-medium cursor-pointer">
            Tes Akhir
          </Label>
          {opsi.tesAkhir.enabled && (
            <div className="flex items-center space-x-2 ml-2">
              <Select
                value={opsi.tesAkhir.inputType}
                onValueChange={(val) => setOpsi({ ...opsi, tesAkhir: { ...opsi.tesAkhir, inputType: val as 'number' | 'boolean' } })}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Tipe Input" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Tipe: Angka (%)</SelectItem>
                  <SelectItem value="boolean">Tipe: YA / TIDAK</SelectItem>
                </SelectContent>
              </Select>
              {opsi.tesAkhir.inputType === 'number' && (
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={opsi.tesAkhir.weight}
                    onChange={(e) => setOpsi({ ...opsi, tesAkhir: { ...opsi.tesAkhir, weight: Number(e.target.value) } })}
                    className="w-16 px-2 py-1 text-sm border rounded-md"
                    aria-label="Bobot Tes Akhir"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="opsi-rate"
            checked={opsi.rate}
            onCheckedChange={(checked) => setOpsi({ ...opsi, rate: checked === true })}
          />
          <Label htmlFor="opsi-rate" className="font-medium cursor-pointer">
            Rate Asprak
          </Label>
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────────── */}
      <div className="border-t pt-4">
        {/* ── Toggle Sheet Rekap ────────────────────────────────────── */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="opsi-rekap"
            checked={generateRekapSheet}
            disabled={!canGenerateRekap}
            onCheckedChange={(checked) => onToggleRekapSheet(checked === true)}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Label
                htmlFor="opsi-rekap"
                className={`font-medium cursor-pointer ${!canGenerateRekap ? 'text-muted-foreground' : ''}`}
              >
                Generate Sheet REKAP &amp; ASPRAK BELUM NILAI
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
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {asprakCount} asprak ditemukan
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  Asprak belum di-plot
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Menambahkan 2 sheet tambahan:{' '}
              <strong>ASPRAK BELUM NILAI</strong> (daftar asprak sebagai Excel Table) dan{' '}
              <strong>REKAP</strong> (tracking kelengkapan nilai per asprak per modul dengan formula otomatis).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
