import * as React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PraktikumSelectorProps {
  praktikumList: { id: string; nama: string }[];
  selectedPraktikumId: string;
  setSelectedPraktikumId: (val: string) => void;
  loadingPraktikum: boolean;
  availableJurusans: string[];
  selectedJurusan: string;
  setSelectedJurusan: (val: string) => void;
}

export function PraktikumSelector({
  praktikumList,
  selectedPraktikumId,
  setSelectedPraktikumId,
  loadingPraktikum,
  availableJurusans,
  selectedJurusan,
  setSelectedJurusan,
}: PraktikumSelectorProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Praktikum</Label>
        <Select
          value={selectedPraktikumId}
          onValueChange={setSelectedPraktikumId}
          disabled={loadingPraktikum}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={loadingPraktikum ? 'Memuat...' : 'Pilih Praktikum'} />
          </SelectTrigger>
          <SelectContent>
            {praktikumList.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {availableJurusans.length > 0 && (
        <div className="space-y-2">
          <Label>Jurusan</Label>
          <Select value={selectedJurusan} onValueChange={setSelectedJurusan}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Jurusan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jurusan</SelectItem>
              {availableJurusans.map((j) => (
                <SelectItem key={j} value={j}>
                  {j}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}
