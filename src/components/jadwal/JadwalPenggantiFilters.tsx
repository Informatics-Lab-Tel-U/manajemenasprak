'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ALL_MATA_KULIAH_VALUE = '__all_mata_kuliah__';
export const ALL_MODUL_VALUE = '__all_modul__';

export interface JadwalPenggantiOptions {
  mata_kuliah: string[];
  modul: number[];
}

interface JadwalPenggantiFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  options: JadwalPenggantiOptions;
  mataKuliahFilter: string;
  onMataKuliahFilterChange: (val: string) => void;
  modulFilter: string;
  onModulFilterChange: (val: string) => void;
}

export default function JadwalPenggantiFilters({
  searchQuery,
  onSearchChange,
  options,
  mataKuliahFilter,
  onMataKuliahFilterChange,
  modulFilter,
  onModulFilterChange,
}: JadwalPenggantiFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col xl:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Search size={18} />
          </div>
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari mata kuliah, kelas, hari, atau ruangan..."
            className="pl-10 h-10 w-full bg-background"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            value={mataKuliahFilter || ALL_MATA_KULIAH_VALUE}
            onValueChange={(value) =>
              onMataKuliahFilterChange(value === ALL_MATA_KULIAH_VALUE ? '' : value)
            }
          >
            <SelectTrigger className="h-10 bg-background sm:w-[200px]">
              <SelectValue placeholder="Semua Mata Kuliah" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_MATA_KULIAH_VALUE}>Semua Mata Kuliah</SelectItem>
              {options.mata_kuliah.map((mk) => (
                <SelectItem key={mk} value={mk}>
                  {mk}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={modulFilter || ALL_MODUL_VALUE}
            onValueChange={(value) =>
              onModulFilterChange(value === ALL_MODUL_VALUE ? '' : value)
            }
          >
            <SelectTrigger className="h-10 bg-background sm:w-[150px]">
              <SelectValue placeholder="Semua Modul" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_MODUL_VALUE}>Semua Modul</SelectItem>
              {options.modul.map((modulNum) => (
                <SelectItem key={modulNum} value={modulNum.toString()}>
                  Modul {modulNum}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
