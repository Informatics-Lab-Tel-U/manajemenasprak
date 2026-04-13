'use client';

import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import JagaPanel from '@/components/jadwal/JagaPanel';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import JagaInputModal from '@/components/jadwal/JagaInputModal';

export default function JadwalJagaClient({ initialTerms, userRole }: { initialTerms: string[], userRole?: string }) {
  const [selectedTerm, setSelectedTerm] = useState(initialTerms[0] || '');
  const [selectedModul, setSelectedModul] = useState('Modul 1');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [konfigurasiModul, setKonfigurasiModul] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const moduls = Array.from({ length: 16 }, (_, i) => `Modul ${i + 1}`);
  const modulNum = selectedModul === 'Default' ? 0 : parseInt(selectedModul.replace('Modul ', ''));

  useEffect(() => {
    if (selectedTerm) {
      fetch(`/api/modul-schedule?term=${selectedTerm}`)
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.data) {
            setKonfigurasiModul(data.data);
          }
        })
        .catch(console.error);
    }
  }, [selectedTerm]);

  const handleRefresh = () => setRefreshTrigger(prev => prev + 1);

  const handleAdd = () => {
    setEditingData(null);
    setIsModalOpen(true);
  };

  const handleEdit = (data: any) => {
    setEditingData(data);
    setIsModalOpen(true);
  };

  return (
    <div className="container space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Penjagaan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Input dan kelola jadwal jaga Asisten Praktikum
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Select value={selectedModul} onValueChange={setSelectedModul}>
            <SelectTrigger className="w-full sm:w-[160px] bg-card/50 backdrop-blur-sm">
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
            <SelectTrigger className="w-full sm:w-[160px] bg-card/50 backdrop-blur-sm">
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

          <Button 
            onClick={handleAdd} 
            className="flex-1 sm:flex-none min-w-0 md:whitespace-nowrap rounded-lg shadow-sm"
          >
            <Plus size={18} className="flex-shrink-0" />
            <span className="hidden sm:inline ml-2 font-medium">Input Jaga</span>
          </Button>
        </div>
      </div>

      <div className="h-[600px]">
        <JagaPanel 
          term={selectedTerm}
          selectedModul={selectedModul}
          userRole={userRole}
          onRefreshTrigger={refreshTrigger}
          onEdit={handleEdit}
        />
      </div>

      <JagaInputModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingData(null);
        }}
        term={selectedTerm}
        selectedModul={modulNum}
        konfigurasiModul={konfigurasiModul}
        defaultDay="SENIN"
        userRole={userRole}
        editData={editingData}
        onSuccess={() => {
          handleRefresh();
          setIsModalOpen(false);
          setEditingData(null);
        }}
      />
    </div>
  );
}
