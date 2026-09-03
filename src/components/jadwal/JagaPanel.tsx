/* eslint-disable react-doctor/no-impure-state-updater */
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Edit2, Shield, X } from 'lucide-react';
import { useJaga } from '@/hooks/useJaga';
import { getJagaShiftsByDay } from '@/utils/jagaUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { deleteJadwalJaga, bulkDeleteJadwalJaga } from '@/lib/fetchers/jagaFetcher';
import { usePresensiJagaStore } from '@/store/usePresensiJagaStore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
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
import { Spinner } from '@/components/ui/spinner';

interface JagaPanelProps {
  term: string;
  selectedModul: string; // e.g. "Default" or "Modul 1"
  filterDay?: string; // Optional: "SENIN", etc.
  hideInputButton?: boolean;
  userRole?: string;
  onRefreshTrigger?: number;
  onEdit?: (data: any) => void;
  onDayChange?: (day: string) => void;
}

export default function JagaPanel({
  term,
  selectedModul,
  filterDay,
  hideInputButton: _hideInputButton,
  userRole,
  onRefreshTrigger,
  onEdit,
  onDayChange,
}: JagaPanelProps) {
  const isDefault = selectedModul === 'Default';
  const modulNum = isDefault ? 0 : parseInt(selectedModul.replace('Modul ', ''));

  const [localDay, setLocalDay] = useState('SENIN');
  const activeDay = (filterDay || localDay).toUpperCase();

  const { jagaList, loading, refresh } = useJaga(
    isDefault ? '' : term,
    isDefault ? undefined : modulNum,
    activeDay
  );

  const todayPresensi = usePresensiJagaStore((s) => s.todayPresensi);
  const initPresensi = usePresensiJagaStore((s) => s.init);

  useEffect(() => {
    initPresensi();
  }, [initPresensi]);

  useEffect(() => {
    if (onRefreshTrigger !== undefined && onRefreshTrigger > 0) {
      refresh();
    }
  }, [onRefreshTrigger, refresh]);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{
    id: string;
    code: string;
    id_asprak: string;
    shift: number;
  } | null>(null);
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
          shift,
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
    } catch {
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
          <p className="text-sm">
            Pilih Modul (W1, W2, dst) untuk melihat jadwal Jaga Aslab/Asprak.
          </p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="space-y-4 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 2xl:h-24 w-full" />
          ))}
        </div>
      );
    }

    const dayJaga = jagaList.filter((j) => j.hari.toUpperCase() === activeDay.toUpperCase());

    return (
      <div className="mt-4 space-y-3">
        {shifts.map((shiftInfo) => {
          const shiftJaga = dayJaga.filter(
            (j) => j.shift.toString() === shiftInfo.shift.toString()
          );

          return (
            <div
              key={shiftInfo.shift}
              className="p-3 border border-border/50 rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base 2xl:text-lg tracking-tight text-foreground/90">
                    Shift {shiftInfo.shift}
                  </span>
                </div>
                <span className="text-xs 2xl:text-sm font-bold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full border border-border/30">
                  {shiftInfo.jam}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {shiftJaga.length > 0 ? (
                  shiftJaga.map((j) => {
                    const presensi = todayPresensi.find(
                      (p) =>
                        p.id_asprak === j.id_asprak &&
                        p.shift === j.shift &&
                        p.hari.toUpperCase() === activeDay.toUpperCase() &&
                        (!modulNum || p.modul === modulNum)
                    );
                    const isHadir = !!presensi;
                    const hadirTime = presensi?.waktu_masuk
                      ? format(new Date(presensi.waktu_masuk), 'HH:mm', { locale: id })
                      : null;
                    const isTerlambat = presensi?.status === 'TERLAMBAT';

                    return (
                      <div
                        key={j.id}
                        className={`group relative flex items-center gap-1.5 text-xs 2xl:text-sm px-3 py-2 rounded-md font-semibold transition-all shadow-sm border
                          ${
                            isHadir
                              ? isTerlambat
                                ? 'bg-amber-50/80 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 ring-1 ring-amber-500/50'
                                : 'bg-green-50/80 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800/60 ring-1 ring-green-500/50'
                              : j.asprak?.role === 'ASLAB'
                              ? 'bg-blue-50/50 text-blue-700 border-blue-200/60 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/40'
                              : 'bg-slate-50/50 text-slate-700 border-slate-200/60 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/60'
                          }`}
                        title={`${j.asprak?.nama_lengkap} (${j.asprak?.nim})${isHadir ? ` — ${isTerlambat ? 'Terlambat' : 'Hadir'} ${hadirTime}` : ''}`}
                      >
                        {isHadir ? (
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isTerlambat ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'
                            }`}
                          />
                        ) : null}
                        <span className="truncate max-w-[80px] 2xl:max-w-[100px]">{j.asprak?.kode || 'Unknown'}</span>
                        {isHadir && hadirTime ? (
                          <span
                            className={`text-[10px] font-normal px-1 py-0.2 rounded ${
                              isTerlambat
                                ? 'bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                                : 'bg-green-200/60 dark:bg-green-900/60 text-green-900 dark:text-green-200'
                            }`}
                          >
                            {hadirTime}
                          </span>
                        ) : null}

                        {/* Hover Actions */}
                        {userRole === 'ADMIN' && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 border-l pl-1 border-current/20">
                            <button
                              type="button"
                              aria-label="Edit"
                              onClick={() => {
                                if (onEdit) {
                                  onEdit({
                                    id: j.id,
                                    id_asprak: j.id_asprak,
                                    hari: j.hari,
                                    shift: j.shift,
                                  });
                                }
                              }}
                              className="hover:text-primary transition-colors p-0.5"
                              title="Edit"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              aria-label="Delete"
                              title="Delete"
                              onClick={() => {
                                setDeletingItem({
                                  id: j.id,
                                  code: j.asprak?.kode || 'Asisten',
                                  id_asprak: j.id_asprak,
                                  shift: shiftInfo.shift,
                                });
                                setDeleteScope('single');
                                setIsDeleteDialogOpen(true);
                              }}
                              className="hover:text-destructive transition-colors p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full py-4 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-md bg-muted/5">
                    <span className="text-xs text-muted-foreground/60 italic">
                      Belum ada penjagaan
                    </span>
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
      <div className="flex flex-col h-full">
        {/* Konten — langsung tanpa header button */}
        <div>
          <div className="mb-4 pt-1">
            <div className="text-sm 2xl:text-base text-muted-foreground mb-2 flex items-center justify-between">
              <span>Menampilkan shift untuk hari:</span>
              <span className="font-semibold text-foreground">{activeDay.toUpperCase()}</span>
            </div>
            {!filterDay && (
              <div className="flex gap-1.5 overflow-x-auto pb-2">
                {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setLocalDay(d);
                      onDayChange?.(d.toUpperCase());
                    }}
                    className={`px-4 py-1.5 rounded-full text-sm 2xl:text-base font-medium whitespace-nowrap transition-colors border
                       ${
                         activeDay.toUpperCase() === d.toUpperCase()
                           ? 'bg-primary text-primary-foreground border-primary'
                           : 'bg-muted/50 hover:bg-muted border-transparent'
                       }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
          {renderContent()}

          {/* Legenda Status Kehadiran / Penjagaan */}
          {!isDefault && !loading && (
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-muted-foreground border-t border-border/50 pt-4 px-1">
              <span className="font-semibold text-foreground/80 text-xs">Legenda:</span>
              
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-green-50/80 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800/60 ring-1 ring-green-500/50">
                  <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                  Hadir
                </span>
                <span className="text-muted-foreground">Tepat Waktu</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border bg-amber-50/80 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 ring-1 ring-amber-500/50">
                  <CheckCircle2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  Terlambat
                </span>
                <span className="text-muted-foreground">Presensi &gt; Toleransi</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded border bg-blue-50/50 text-blue-700 border-blue-200/60 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/40">
                  ASLAB
                </span>
                <span className="text-muted-foreground">Belum Hadir</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded border bg-slate-50/50 text-slate-700 border-slate-200/60 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/60">
                  ASPRAK
                </span>
                <span className="text-muted-foreground">Belum Hadir</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Konfirmasi Hapus Jadwal
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus jadwal jaga untuk <strong>{deletingItem?.code}</strong>. Pilih
              cakupan penghapusan di bawah ini:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <RadioGroup
              value={deleteScope}
              onValueChange={(val: any) => setDeleteScope(val)}
              className="grid gap-4"
            >
              <label
                htmlFor="single"
                className="flex items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value="single" id="single" className="mt-1" />
                <div className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  <span className="block mb-1">Hanya Modul Ini Saja</span>
                  <span className="block text-[11px] font-normal text-muted-foreground">
                    Menghapus jadwal asisten hanya pada modul yang sedang dipilih sekarang.
                  </span>
                </div>
              </label>
              <label
                htmlFor="bulk"
                className="flex items-start space-x-3 space-y-0 rounded-md border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <RadioGroupItem value="bulk" id="bulk" className="mt-1" />
                <div className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  <span className="block mb-1">Semua Modul</span>
                  <span className="block text-[11px] font-normal text-muted-foreground">
                    Menghapus jadwal asisten dari seluruh modul untuk hari, shift,
                    dan ruang yang sama.
                  </span>
                </div>
              </label>
            </RadioGroup>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmedDelete();
              }}
              variant={'destructive'}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Menghapus...
                </>
              ) : 'Ya, Hapus Jadwal'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
