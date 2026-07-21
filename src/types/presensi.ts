export interface AsprakEntry {
  nama: string;
  kode: string;
}

export interface PresensiComponent {
  enabled: boolean;
  weight: number;
  inputType: 'number' | 'boolean';
}

export interface PresensiFormOptions {
  tp: PresensiComponent;
  jurnal: PresensiComponent;
  tesAkhir: PresensiComponent;
  rate: boolean;
}

export interface KelasSetting {
  tanggalMulai: Date | undefined;
  jumlahPraktikan: number;
  jumlahAsprak: number;
}

import { ThemeKey } from '@/constants/presensiConstants';

export type { ThemeKey };

export interface PresensiGeneratorOptions {
  namaFile: string;
  kelasNames: string[];
  jumlahModul: number;
  kelasSettings: KelasSetting[];
  opsi: PresensiFormOptions;
  asprakList?: AsprakEntry[];
  generateRekapSheet?: boolean;
  theme?: ThemeKey;
}
