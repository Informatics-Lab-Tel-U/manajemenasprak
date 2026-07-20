import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PresensiFormOptions } from '@/hooks/usePresensiForm';

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
          checked={opsi.tp}
          onCheckedChange={(checked) => setOpsi({ ...opsi, tp: checked === true })}
        />
        <Label htmlFor="opsi-tp" className="font-medium cursor-pointer">
          Tugas Pendahuluan (TP)
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="opsi-jurnal"
          checked={opsi.jurnal}
          onCheckedChange={(checked) => setOpsi({ ...opsi, jurnal: checked === true })}
        />
        <Label htmlFor="opsi-jurnal" className="font-medium cursor-pointer">
          Jurnal / Test Awal
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="opsi-tesAkhir"
          checked={opsi.tesAkhir}
          onCheckedChange={(checked) => setOpsi({ ...opsi, tesAkhir: checked === true })}
        />
        <Label htmlFor="opsi-tesAkhir" className="font-medium cursor-pointer">
          Tes Akhir
        </Label>
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
