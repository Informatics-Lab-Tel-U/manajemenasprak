import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Edit2, Plus, Shield, X } from 'lucide-react';
import { useJaga } from '@/hooks/useJaga';
import { getJagaShiftsByDay } from '@/utils/jagaUtils';
import JagaInputModal from './JagaInputModal';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { deleteJadwalJaga, bulkDeleteJadwalJaga } from '@/lib/fetchers/jagaFetcher';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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
  const [editingEntry, setEditingEntry] = useState<any>(null);

  // Delete Confirmation State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{id: string, code: string, id_asprak: string, shift: number} | null>(null);
  const [deleteScope, setDeleteScope] = useState<'single' | 'bulk'>('single');

  const shifts = getJagaShiftsByDay(activeDay);

  const handleConfirmedDelete = async () => {
    if (!deletingItem) return;
    
    const { id, code, id_asprak, shift } = deletingItem;

    try {
      if (deleteScope === 'bulk') {
         const { success, error } = await bulkDeleteJadwalJaga({
           id_asprak,
           tahun_ajaran: term,
           moduls: Array.from({ length: 16 }, (_, i) => i + 1),
           hari: activeDay,
           shift
         });
         if (success) {
           toast.success(`Jadwal jaga ${code} berhasil dihapus dari semua modul`);
           refresh();
         } else {
           toast.error(error || 'Gagal menghapus bulk');
         }
      } else {
         const { success, error } = await deleteJadwalJaga(id);
         if (success) {
           toast.success('Jadwal jaga berhasil dihapus');
           refresh();
         } else {
           toast.error(error || 'Gagal menghapus');
         }
      }
    } catch (err) {
      toast.error('Gagal menghapus jadwal jaga');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
    }
  };

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
            <div key={shiftInfo.shift} className="p-3 border border-border/50 rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                   <span className="font-bold text-sm tracking-tight text-foreground/90">Shift {shiftInfo.shift}</span>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border/30">{shiftInfo.jam}</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {shiftJaga.length > 0 ? (
                  shiftJaga.map(j => (
                    <div 
                      key={j.id} 
                      className={`group relative flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md font-semibold transition-all shadow-sm border
                        ${
                          j.asprak?.role === 'ASLAB' 
                            ? 'bg-blue-50/50 text-blue-700 border-blue-200/60 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/40' 
                            : 'bg-slate-50/50 text-slate-700 border-slate-200/60 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/60'
                        }`}
                      title={`${j.asprak?.nama_lengkap} (${j.asprak?.nim})`}
                    >
                      <span className="truncate max-w-[80px]">{j.asprak?.kode || 'Unknown'}</span>
                      
                      {/* Hover Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 border-l pl-1 border-current/20">
                         <button 
                           onClick={() => {
                             setEditingEntry({
                               id: j.id,
                               id_asprak: j.id_asprak,
                               hari: j.hari,
                               shift: j.shift
                             });
                             setIsModalOpen(true);
                           }}
                           className="hover:text-primary transition-colors p-0.5"
                           title="Edit"
                         >
                            <Edit2 className="w-3 h-3" />
                         </button>
                          <button 
                            onClick={() => {
                              setDeletingItem({ 
                                id: j.id, 
                                code: j.asprak?.kode || 'Asisten', 
                                id_asprak: j.id_asprak, 
                                shift: shiftInfo.shift 
                              });
                              setDeleteScope('single');
                              setIsDeleteDialogOpen(true);
                            }}
                            className="hover:text-destructive transition-colors p-0.5"
                            title="Hapus"
                          >
                             <X className="w-3 h-3" />
                          </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full py-4 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-md bg-muted/5">
                    <span className="text-xs text-muted-foreground/60 italic">Belum ada penjagaan</span>
                  </div>
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

      <JagaInputModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
        }}
        term={term}
        selectedModul={modulNum}
        konfigurasiModul={konfigurasiModul}
        defaultDay={activeDay}
        userRole={userRole}
        onSuccess={refresh}
        editData={editingEntry}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
               <AlertTriangle className="h-5 w-5" />
               Konfirmasi Hapus Jadwal
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus jadwal jaga untuk <strong>{deletingItem?.code}</strong>. 
              Pilih cakupan penghapusan di bawah ini:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <RadioGroup 
              value={deleteScope} 
              onValueChange={(val: any) => setDeleteScope(val)}
              className="grid gap-4"
            >
              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setDeleteScope('single')}>
                <RadioGroupItem value="single" id="single" className="mt-1" />
                <Label htmlFor="single" className="cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  <span className="block mb-1">Hanya Modul Ini Saja</span>
                  <span className="block text-[11px] font-normal text-muted-foreground">Menghapus jadwal asisten hanya pada modul yang sedang dipilih sekarang.</span>
                </Label>
              </div>
              <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setDeleteScope('bulk')}>
                <RadioGroupItem value="bulk" id="bulk" className="mt-1" />
                <Label htmlFor="bulk" className="cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  <span className="block mb-1 text-amber-600 dark:text-amber-500 font-bold">Seluruh Modul (Bulk)</span>
                  <span className="block text-[11px] font-normal text-muted-foreground">Menghapus jadwal asisten pada hari dan shift yang sama di SELURUH MODUL (W1-W16).</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleConfirmedDelete();
              }}
              variant={
                "destructive"
              }
              disabled={loading}
            >
              {loading ? 'Menghapus...' : 'Ya, Hapus Jadwal'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
