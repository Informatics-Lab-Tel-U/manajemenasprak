import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
}

export function OptionsToggles({ opsi, setOpsi }: OptionsTogglesProps) {
  return (
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
  );
}
