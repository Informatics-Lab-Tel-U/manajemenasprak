'use client';

import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import JagaPanel from '@/components/jadwal/JagaPanel';

export default function JadwalJagaClient({ initialTerms, userRole }: { initialTerms: string[], userRole?: string }) {
  const [selectedTerm, setSelectedTerm] = useState(initialTerms[0] || '');
  const [selectedModul, setSelectedModul] = useState('Modul 1');

  const moduls = Array.from({ length: 16 }, (_, i) => `Modul ${i + 1}`);

  return (
    <div className="container space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Penjagaan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Input dan kelola jadwal jaga Asisten Praktikum
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={selectedModul} onValueChange={setSelectedModul}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih Modul" />
            </SelectTrigger>
            <SelectContent>
              {moduls.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih Term" />
            </SelectTrigger>
            <SelectContent>
              {initialTerms.map((term) => (
                <SelectItem key={term} value={term}>
                  {term}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-w-4xl mx-auto h-[600px]">
        <JagaPanel 
          term={selectedTerm}
          selectedModul={selectedModul}
          userRole={userRole}
        />
      </div>
    </div>
  );
}
