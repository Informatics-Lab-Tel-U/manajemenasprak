import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Shield } from 'lucide-react';
import { useJaga } from '@/hooks/useJaga';
import { getJagaShiftsByDay } from '@/utils/jagaUtils';
import JagaInputModal from './JagaInputModal';
import { Skeleton } from '@/components/ui/skeleton';

interface JagaPanelProps {
  term: string;
  selectedModul: string; // e.g. "Default" or "Modul 1"
  filterDay?: string; // Optional: "SENIN", etc.
  hideInputButton?: boolean;
  userRole?: string;
}

export default function JagaPanel({ term, selectedModul, filterDay, hideInputButton, userRole }: JagaPanelProps) {
  const isDefault = selectedModul === 'Default';
  const modulNum = isDefault ? 0 : parseInt(selectedModul.replace('Modul ', ''));

  const [localDay, setLocalDay] = useState('SENIN');
  const activeDay = (filterDay || localDay).toUpperCase();

  const { jagaList, loading, refresh } = useJaga(isDefault ? '' : term, isDefault ? undefined : modulNum, activeDay);
  
  const [konfigurasiModul, setKonfigurasiModul] = useState<any[]>([]);

  useEffect(() => {
    if (term) {
      fetch(`/api/modul-schedule?term=${term}`)
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.data) {
            setKonfigurasiModul(data.data);
          }
        })
        .catch(console.error);
    }
  }, [term]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const shifts = getJagaShiftsByDay(activeDay);

  const renderContent = () => {
    if (isDefault) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-full">
          <Shield className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">Pilih Modul (W1, W2, dst) untuk melihat jadwal Jaga Aslab/Asprak.</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="space-y-4 mt-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }

    // Filter jaga by the currently viewed day (if not already filtered by API)
    const dayJaga = jagaList.filter(j => j.hari.toUpperCase() === activeDay.toUpperCase());

    return (
      <div className="mt-4 space-y-3">
        {shifts.map((shiftInfo) => {
          const shiftJaga = dayJaga.filter(j => j.shift.toString() === shiftInfo.shift.toString());
          
          return (
            <div key={shiftInfo.shift} className="p-3 border border-border/50 rounded-lg bg-card shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">Shift {shiftInfo.shift}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{shiftInfo.jam}</span>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {shiftJaga.length > 0 ? (
                  shiftJaga.map(j => (
                    <div 
                      key={j.id} 
                      className={`text-[10px] px-2 py-1 rounded-sm font-medium ${
                        j.asprak?.role === 'ASLAB' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                      title={`${j.asprak?.nama_lengkap} (${j.asprak?.nim})`}
                    >
                      {j.asprak?.kode || 'Unknown'}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">Kosong</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Card className="h-full border-border/50 shadow-sm flex flex-col">
        <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              Penjagaan
            </CardTitle>
            <CardDescription className="mt-1">
              {isDefault ? 'Pilih Modul' : `Jadwal Jaga - ${selectedModul}`}
            </CardDescription>
          </div>
          {!hideInputButton && (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 gap-1.5"
              disabled={isDefault}
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Input Jaga</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
             <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
                <span>Menampilkan shift untuk hari:</span>
                <span className="font-semibold text-foreground">{activeDay.toUpperCase()}</span>
             </div>
             {!filterDay && (
               <div className="flex gap-1 overflow-x-auto pb-2">
                 {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(d => (
                   <button
                     key={d}
                     onClick={() => setLocalDay(d)}
                     className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                       activeDay.toUpperCase() === d.toUpperCase()
                         ? 'bg-primary text-primary-foreground'
                         : 'bg-muted hover:bg-muted/80'
                     }`}
                   >
                     {d}
                   </button>
                 ))}
               </div>
             )}
          </div>
          {renderContent()}
        </CardContent>
      </Card>

      {isModalOpen && (
        <JagaInputModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          term={term}
          selectedModul={modulNum}
          konfigurasiModul={konfigurasiModul}
          defaultDay={activeDay}
          userRole={userRole}
          onSuccess={refresh}
        />
      )}
    </>
  );
}
