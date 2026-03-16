'use client';

import React, { useState, useMemo } from 'react';
import { useJadwal } from '@/hooks/useJadwal';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Filter,
  X,
  Clock,
  MapPin,
  User,
  Users,
  ChevronRight,
  Plus,
  Upload,
  PaintBucket,
} from 'lucide-react';
import { Jadwal, MataKuliah } from '@/types/database';
import { JadwalModal } from '@/components/jadwal/JadwalModal';
import { ScheduleCell } from '@/components/jadwal/ScheduleCell';
import JadwalImportCSVModal from '@/components/jadwal/JadwalImportCSVModal';
import { GroupColorModal } from '@/components/jadwal/GroupColorModal';
import { JadwalPenggantiModal } from '@/components/jadwal/JadwalPenggantiModal';
import {
  CreateJadwalInput,
  UpdateJadwalInput,
  CreateJadwalPenggantiInput,
} from '@/services/jadwalService';
import { getAvailableTerms as fetchAvailableTerms } from '@/services/termService';
import { useScheduleData } from '@/hooks/useScheduleData';
import * as jadwalFetcher from '@/lib/fetchers/jadwalFetcher';
import { DAYS, STATIC_SESSIONS } from '@/constants';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getCourseColor } from '@/utils/colorUtils';

interface JadwalClientPageProps {
  initialJadwal: Jadwal[];
  initialTerms: string[];
  initialMataKuliahList: MataKuliah[];
}

function JadwalTableSkeleton() {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-muted/50 border-b border-border">
          <th className="p-2 border-r border-border text-center min-w-[60px]">
            <Skeleton className="h-4 w-8 mx-auto" />
          </th>
          <th className="p-2 border-r border-border text-center min-w-[60px]">
            <Skeleton className="h-4 w-8 mx-auto" />
          </th>
          {Array.from({ length: 4 }).map((_, i) => (
            <th key={i} className="p-2 border-r border-border text-center min-w-[120px]">
              <Skeleton className="h-4 w-16 mx-auto" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 15 }).map((_, i) => (
          <tr key={i} className="border-b border-border/50">
            {i % 3 === 0 && (
              <td rowSpan={3} className="p-2 border-r border-border bg-muted/5 text-center">
                <Skeleton className="h-4 w-12 mx-auto" />
              </td>
            )}
            <td className="p-2 border-r border-border text-center">
              <Skeleton className="h-3 w-10 mx-auto" />
            </td>
            {Array.from({ length: 4 }).map((_, j) => (
              <td key={j} className="p-2 border-r border-border align-top">
                <div className="flex flex-col gap-1 w-full min-h-[60px] justify-center">
                  {(i + j) % 3 === 0 && <Skeleton className="h-14 w-full rounded-sm" />}
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function JadwalClientPage({
  initialJadwal,
  initialTerms,
  initialMataKuliahList,
}: JadwalClientPageProps) {
  const [programType, setProgramType] = useState<'REGULER' | 'PJJ'>('REGULER');

  const {
    data: rawJadwalList,
    jadwalPengganti,
    terms: availableTerms,
    selectedTerm,
    setSelectedTerm,
    moduls,
    selectedModul,
    setSelectedModul,
    loading,
    mataKuliahList,
    addJadwal,
    editJadwal,
    removeJadwal,
    upsertPengganti,
  } = useJadwal(initialTerms[0], {
    jadwal: initialJadwal,
    terms: initialTerms,
    mataKuliah: initialMataKuliahList,
  });

  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);
  const [showSessionId, setShowSessionId] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPenggantiModalOpen, setIsPenggantiModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<any | null>(null);

  const handleOpenAdd = () => {
    setModalInitialData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (jadwal: Jadwal) => {
    setModalInitialData(jadwal);
    if (selectedModul !== 'Default') {
      setIsPenggantiModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
    setSelectedJadwal(null); // Close detail modal
  };

  const handleModalSubmit = async (input: CreateJadwalInput | UpdateJadwalInput) => {
    const hari = 'hari' in input ? input.hari : '';
    const sesi = 'sesi' in input ? input.sesi : null;
    const ruangan = 'ruangan' in input ? input.ruangan : '';
    const id = 'id' in input ? input.id : undefined;
    const inputKelas = 'kelas' in input ? (input.kelas as string) : '';
    const isEditingPJJ = inputKelas.toUpperCase().includes('PJJ');

    // Check for scheduling conflicts in Default mode
    let conflict: Jadwal | undefined;

    conflict = rawJadwalList.find((j) => {
      const isExistingPJJ = j.kelas?.toUpperCase().includes('PJJ');
      if (isEditingPJJ || isExistingPJJ) return false;

      return (
        Number(j.id) !== Number(id) &&
        j.hari === hari &&
        j.sesi === Number(sesi) &&
        j.ruangan === ruangan
      );
    });

    const conflictName = conflict?.mata_kuliah?.nama_lengkap || 'Unknown Course';
    const conflictClass = conflict?.kelas || 'Unknown Class';

    if (conflict) {
      toast.error(
        `Gagal: Jadwal bentrok dengan mata kuliah "${conflictName}" (${conflictClass}) di ${ruangan}, ${hari} Sesi ${sesi || (input as any).jam}.`
      );
      return;
    }

    const result =
      'id' in input
        ? await editJadwal(input as UpdateJadwalInput)
        : await addJadwal(input as CreateJadwalInput);

    if (!result.ok) {
      toast.error(`Gagal: ${result.error}`);
    } else {
      toast.success('Jadwal berhasil disimpan');
    }
  };

  const handlePenggantiSubmit = async (input: any) => {
    const result = await upsertPengganti(input);
    if (!result.ok) {
      toast.error(`Gagal: ${result.error}`);
      return false;
    } else {
      toast.success('Jadwal pengganti berhasil disimpan');
      return true;
    }
  };

  const handleImportCSV = async (rows: CreateJadwalInput[]) => {
    const result = await jadwalFetcher.bulkImportJadwal(rows);
    if (result.ok) {
      toast.success(`Berhasil import ${result.data?.inserted} jadwal`);
      window.location.reload();
    } else {
      toast.error(`Gagal import: ${result.error}`);
    }
  };

  const handleDeleteJadwal = async (id: string) => {
    try {
      const result = await removeJadwal(id);
      if (result.ok) {
        toast.success('Jadwal berhasil dihapus');
        setIsModalOpen(false);
      } else {
        toast.error(`Gagal menghapus jadwal: ${result.error}`);
      }
    } catch (e: any) {
      toast.error(`Terjadi kesalahan: ${e.message}`);
    }
  };

  // Use the unified useScheduleData hook
  const { visibleDays, uniqueRooms, scheduleMatrix, dynamicSessionsByDay } = useScheduleData({
    rawJadwalList,
    jadwalPengganti,
    selectedModul,
    programType,
  });

  return (
    <div className="container relative space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Jadwal Praktikum</h1>
            <p className="text-sm text-muted-foreground mt-1">Overview jadwal per ruangan</p>
          </div>

          <div className="bg-muted/50 p-1.5 rounded-lg flex items-center gap-1 border border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setProgramType('REGULER')}
              className={`rounded-md text-sm font-medium transition-all ${
                programType === 'REGULER'
                  ? 'bg-background shadow-sm text-foreground hover:bg-background'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              }`}
            >
              Reguler
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setProgramType('PJJ')}
              className={`rounded-md text-sm font-medium transition-all ${
                programType === 'PJJ'
                  ? 'bg-background shadow-sm text-foreground hover:bg-background'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              }`}
            >
              PJJ
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap md:flex-nowrap gap-2 md:gap-3 items-center w-full md:w-auto">
          <Button
            variant="outline"
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-none min-w-0 md:whitespace-nowrap"
          >
            <Plus size={18} className="shrink-0" />
            <span className="hidden sm:inline ml-2">Tambah Jadwal</span>
          </Button>
          <Button
            onClick={() => setIsImportModalOpen(true)}
            className="flex-1 sm:flex-none min-w-0 md:whitespace-nowrap"
          >
            <Upload size={18} className="shrink-0" />
            <span className="hidden sm:inline ml-2">Import CSV</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsColorModalOpen(true)}
            title="Atur Warna Grup"
            className="px-2 sm:px-3 shrink-0"
          >
            <PaintBucket size={18} />
          </Button>
          <Select value={selectedModul} onValueChange={setSelectedModul}>
            <SelectTrigger className="w-full md:w-[180px] sm:max-w-[180px]">
              <SelectValue placeholder="Select modul" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {moduls.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-full md:w-[180px] sm:max-w-[180px]">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {availableTerms.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border shadow-sm bg-card/50 backdrop-blur-sm min-h-[400px]">
        {loading && (
          <div className="animate-pulse">
            <JadwalTableSkeleton />
          </div>
        )}

        {!loading && uniqueRooms.length > 0 && (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="p-2 border-r border-border text-center font-bold min-w-[60px] text-xs uppercase text-muted-foreground">
                  Hari
                </th>
                <th
                  className="p-2 border-r border-border text-center font-bold min-w-[60px] text-xs uppercase text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none group"
                  onClick={() => setShowSessionId(!showSessionId)}
                  title="Click to toggle between Time/Session"
                >
                  <div className="flex items-center justify-center gap-1">
                    {showSessionId ? 'SESI' : 'JAM'}
                    <ChevronRight
                      size={12}
                      className={`transition-transform ${showSessionId ? 'rotate-90' : ''}`}
                    />
                  </div>
                </th>
                {uniqueRooms.map((room) => (
                  <th
                    key={room}
                    className="p-2 border-r border-border text-center font-bold min-w-[120px] whitespace-nowrap text-xs"
                  >
                    {room}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleDays.map((day) => {
                const daySessions = dynamicSessionsByDay[day] || [];
                if (daySessions.length === 0) return null;

                return daySessions.map((session, sessionIndex) => {
                  const isFirstRow = sessionIndex === 0;

                  return (
                    <tr
                      key={`${day}-${session.rowKey}`}
                      className="hover:bg-muted/30 transition-colors border-b border-border/50"
                    >
                      {isFirstRow && (
                        <td
                          rowSpan={daySessions.length}
                          className="p-2 border-r border-border border-b border-border text-center font-bold bg-muted/10 align-middle text-sm"
                        >
                          {day}
                        </td>
                      )}

                      <td
                        className="p-2 border-r border-border text-center font-medium text-muted-foreground text-xs cursor-pointer hover:bg-muted/50"
                        onClick={() => setShowSessionId(!showSessionId)}
                        title={showSessionId ? session.jam : `Sesi ${session.sesi ?? '-'}`}
                      >
                        {showSessionId ? (session.sesi ?? sessionIndex + 1) : session.jam}
                      </td>

                      {uniqueRooms.map((room) => {
                        const jadwals = scheduleMatrix[day]?.[session.rowKey]?.[room] || [];

                        return (
                          <td
                            key={`${day}-${session.rowKey}-${room}`}
                            className="p-0 border-r border-border align-top relative min-w-[120px]"
                          >
                            <div className="flex flex-col w-full h-full min-h-[60px]">
                              {jadwals.map((jadwal, idx) => (
                                <ScheduleCell
                                  key={jadwal.id || idx}
                                  jadwal={jadwal}
                                  onClick={() => setSelectedJadwal(jadwal)}
                                  showAsprakCount={true}
                                />
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3 px-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm ring-2 ring-inset ring-yellow-400 bg-muted"></div>
            <span>Jadwal Pengganti</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-muted border border-border"></div>
            <span>Jadwal Reguler</span>
          </div>
        </div>

        {!loading && uniqueRooms.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <Filter size={48} className="mb-4 opacity-20" />
            <p>No schedule data found for this term.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedJadwal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedJadwal(null)}
        >
          <div
            className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border/50 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-6 pb-4 border-b border-border/50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedJadwal(null)}
                className="absolute top-4 right-4 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X size={20} />
              </Button>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {selectedJadwal.mata_kuliah?.program_studi || 'N/A'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">
                  {selectedJadwal.sesi ? `Sesi ${selectedJadwal.sesi}` : 'Non-Sesi'}
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold leading-tight mb-1">
                {selectedJadwal.mata_kuliah?.nama_lengkap}
              </h2>
              <p className="text-lg font-medium text-foreground/80">Kelas {selectedJadwal.kelas}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Clock className="text-blue-500 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Waktu
                    </p>
                    <p className="text-sm font-semibold">
                      {selectedJadwal.hari}, {selectedJadwal.jam}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <MapPin className="text-emerald-500 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Ruangan
                    </p>
                    <p className="text-sm font-semibold">
                      {!selectedJadwal.ruangan || selectedJadwal.ruangan === 'Tanpa Ruangan'
                        ? '-'
                        : selectedJadwal.ruangan}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <User className="text-amber-500 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Dosen
                    </p>
                    <p className="text-sm font-semibold">{selectedJadwal.dosen || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Users className="text-violet-500 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Kebutuhan
                    </p>
                    <p className="text-sm font-semibold">{selectedJadwal.total_asprak} Asprak</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/20 border-t border-border/50 text-right">
              <div className="flex gap-2 justify-end items-center">
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
                      handleDeleteJadwal(selectedJadwal.id);
                    }
                  }}
                  className="mr-auto"
                >
                  Hapus Jadwal
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleOpenEdit(selectedJadwal)}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  Edit Jadwal
                </Button>

                <Button onClick={() => setSelectedJadwal(null)}>Tutup</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <JadwalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={modalInitialData}
        mataKuliahList={mataKuliahList}
        isLoading={loading}
      />

      <JadwalPenggantiModal
        isOpen={isPenggantiModalOpen}
        onClose={() => setIsPenggantiModalOpen(false)}
        onSubmit={handlePenggantiSubmit}
        initialData={
          modalInitialData
            ? {
                id: modalInitialData.id,
                id_jadwal: modalInitialData.id,
                modul: parseInt(selectedModul.replace('Modul ', '')) || 1,
                tanggal: modalInitialData.tanggal || '',
                hari: modalInitialData.hari || 'SENIN',
                sesi: modalInitialData.sesi || 1,
                jam: modalInitialData.jam || '06:30',
                ruangan: modalInitialData.ruangan || '',
                jadwal: modalInitialData,
              }
            : null
        }
        mataKuliahList={mataKuliahList}
        allJadwal={rawJadwalList}
        isLoading={loading}
        currentTerm={selectedTerm}
        disableModul={selectedModul !== 'Default'}
      />

      <JadwalImportCSVModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCSV}
        mataKuliahList={mataKuliahList}
        term={selectedTerm}
      />

      <GroupColorModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        mataKuliahList={mataKuliahList}
      />
    </div>
  );
}
