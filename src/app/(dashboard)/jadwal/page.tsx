'use client';

import { useState, useMemo } from 'react';
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
import { Filter, X, Clock, MapPin, User, Users, ChevronRight, Plus, Upload } from 'lucide-react';
import { Jadwal } from '@/types/database';
import { JadwalModal } from '@/components/jadwal/JadwalModal';
import JadwalImportCSVModal from '@/components/jadwal/JadwalImportCSVModal';
import {
  CreateJadwalInput,
  UpdateJadwalInput,
  CreateJadwalPenggantiInput,
} from '@/services/jadwalService';
import * as jadwalFetcher from '@/lib/fetchers/jadwalFetcher';
import { DAYS, STATIC_SESSIONS } from '@/constants';
import { toast } from 'sonner';

import { getCourseColor } from '@/utils/colorUtils';

export default function JadwalPage() {
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
    upsertPengganti,
  } = useJadwal();

  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);
  const [showSessionId, setShowSessionId] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<Jadwal | null>(null);

  const handleOpenAdd = () => {
    setModalInitialData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (jadwal: Jadwal) => {
    setModalInitialData(jadwal);
    setIsModalOpen(true);
    setSelectedJadwal(null); // Close detail modal
  };

  const handleModalSubmit = async (
    input: CreateJadwalInput | UpdateJadwalInput | CreateJadwalPenggantiInput
  ) => {
    const { hari, sesi, ruangan, id_jadwal, id } = input as any;
    const currentId = selectedModul !== 'Default' ? id_jadwal : id;

    // Check for scheduling conflicts
    let conflict: Jadwal | undefined;

    if (selectedModul === 'Default') {
      conflict = rawJadwalList.find(
        (j) =>
          j.id !== currentId && j.hari === hari && j.sesi === Number(sesi) && j.ruangan === ruangan
      );
    } else {
      // Create effective schedule list merging base and substitutes
      const effectiveJadwal = rawJadwalList.map((j) => {
        const substitute = jadwalPengganti.find((jp) => jp.id_jadwal === j.id);
        return substitute ? { ...j, ...substitute } : j;
      });

      conflict = effectiveJadwal.find(
        (j) =>
          j.id !== currentId && j.hari === hari && j.sesi === Number(sesi) && j.ruangan === ruangan
      );
    }

    if (conflict) {
      const conflictName = conflict.mata_kuliah?.nama_lengkap || 'Unknown Course';
      const conflictClass = conflict.kelas || 'Unknown Class';
      toast.error(
        `Gagal: Jadwal bentrok dengan mata kuliah "${conflictName}" (${conflictClass}) di ${ruangan}, ${hari} Sesi ${sesi}.`
      );
      return;
    }

    // Process submission
    const result =
      selectedModul !== 'Default'
        ? await upsertPengganti(input)
        : 'id' in input && !('modul' in input)
          ? await editJadwal(input as UpdateJadwalInput)
          : await addJadwal(input as CreateJadwalInput);

    if (!result.ok) {
      toast.error(`Gagal: ${result.error}`);
    } else {
      toast.success('Jadwal berhasil disimpan');
    }
  };

  const handleImportCSV = async (rows: CreateJadwalInput[]) => {
    const result = await jadwalFetcher.bulkImportJadwal(rows);
    if (result.ok) {
      toast.success(`Berhasil import ${result.data?.inserted} jadwal`);
      window.location.reload(); // Simple reload to refresh data
    } else {
      toast.error(`Gagal import: ${result.error}`);
    }
  };

  const jadwalList = useMemo(() => {
    let combinedJadwal = rawJadwalList;

    // Merge logic: If Modul is selected, override default jadwal with substitute
    if (selectedModul !== 'Default' && jadwalPengganti.length > 0) {
      combinedJadwal = rawJadwalList.map((j) => {
        const substitute = jadwalPengganti.find((jp) => jp.id_jadwal === j.id);
        if (substitute) {
          return {
            ...j,
            ruangan: substitute.ruangan,
            jam: substitute.jam,
            hari: substitute.hari,
            sesi: substitute.sesi,
            tanggal: substitute.tanggal, // Map substitute date
            // Substitute doesn't override mata kuliah, kelas, etc. based on requirements, usually just time/room
            // But if it changes day/session, it moves in the matrix
          };
        }
        return j;
      });
    }

    return combinedJadwal.filter((j) => {
      const isPJJ =
        j.mata_kuliah?.program_studi?.toUpperCase().includes('PJJ') ||
        j.kelas?.toUpperCase().includes('PJJ');

      if (programType === 'PJJ') {
        return isPJJ;
      } else {
        return !isPJJ;
      }
    });
  }, [rawJadwalList, jadwalPengganti, selectedModul, programType]);

  const uniqueRooms = useMemo(() => {
    const rooms = new Set<string>();
    jadwalList.forEach((j) => {
      if (j.ruangan) rooms.add(j.ruangan);
    });
    return Array.from(rooms).sort();
  }, [jadwalList]);

  const scheduleMatrix = useMemo(() => {
    const matrix: Record<string, Record<number, Record<string, Jadwal>>> = {};
    jadwalList.forEach((j) => {
      if (!j.hari || !j.sesi || !j.ruangan) return;
      if (!matrix[j.hari]) matrix[j.hari] = {};
      if (!matrix[j.hari][j.sesi]) matrix[j.hari][j.sesi] = {};
      matrix[j.hari][j.sesi][j.ruangan] = j;
    });
    return matrix;
  }, [jadwalList]);

  const visibleDays = useMemo(() => {
    if (programType === 'PJJ') {
      return ['SABTU'];
    }
    return DAYS;
  }, [programType]);

  return (
    <div className="container min-h-screen p-4 sm:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold title-gradient">Jadwal Praktikum</h1>
            <p className="text-muted-foreground text-sm">Overview jadwal per ruangan</p>
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

        <div className="flex gap-3 w-full md:w-auto items-center">
          <Button variant="outline" onClick={handleOpenAdd}>
            <Plus size={18} className="mr-2" />
            Tambah Jadwal
          </Button>
          <Button onClick={() => setIsImportModalOpen(true)}>
            <Upload size={18} className="mr-2" />
            Import CSV
          </Button>
          <Select value={selectedModul} onValueChange={setSelectedModul}>
            <SelectTrigger className="w-full md:w-[180px]">
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
            <SelectTrigger className="w-[180px]">
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
          <div className="flex flex-col items-center justify-center h-[400px] gap-2 text-muted-foreground animate-pulse">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span>Loading schedule data...</span>
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
                const daySessions = STATIC_SESSIONS[day] || [];
                if (daySessions.length === 0) return null;

                return daySessions.map((session, sessionIndex) => {
                  const isFirstRow = sessionIndex === 0;

                  return (
                    <tr
                      key={`${day}-${session.sesi}`}
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
                      >
                        {showSessionId ? session.sesi : session.jam}
                      </td>

                      {uniqueRooms.map((room) => {
                        const jadwal = scheduleMatrix[day]?.[session.sesi]?.[room];

                        return (
                          <td
                            key={`${day}-${session.sesi}-${room}`}
                            className="p-0 border-r border-border h-[60px] w-[120px] relative"
                          >
                            {jadwal ? (
                              <div
                                onClick={() => setSelectedJadwal(jadwal)}
                                className="w-full h-full flex flex-col items-center justify-center p-1 cursor-pointer transition-all hover:brightness-110 overflow-hidden hover:scale-105 hover:z-10 hover:shadow-lg origin-center"
                                style={{
                                  backgroundColor: getCourseColor(
                                    jadwal.mata_kuliah?.nama_lengkap || ''
                                  ),
                                }}
                                title="Click for details"
                              >
                                <div className="text-center leading-tight">
                                  <div className="font-bold text-[10px] sm:text-xs text-white drop-shadow-md truncate w-full px-1">
                                    {/* Use the name from Praktikum relation (short name) OR fallback to full name */}
                                    {jadwal.mata_kuliah?.praktikum?.nama ||
                                      jadwal.mata_kuliah?.nama_lengkap ||
                                      'Unknown'}
                                  </div>
                                  <div className="text-[9px] sm:text-[10px] text-white/90">
                                    {jadwal.kelas}
                                  </div>
                                  <div className="text-[8px] sm:text-[9px] text-white/80 truncate px-1">
                                    {(jadwal.dosen || '-').split(' ')[0]}
                                  </div>
                                </div>
                              </div>
                            ) : null}
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
                  Sesi {selectedJadwal.sesi}
                </span>
              </div>

              <h2
                className="text-xl md:text-2xl font-bold leading-tight mb-1"
                // style={{
                //   color: getCourseColor(selectedJadwal.mata_kuliah?.nama_lengkap || '')
                // }}
              >
                {selectedJadwal.mata_kuliah?.nama_lengkap}
              </h2>
              <p className="text-lg font-medium text-foreground/80">Kelas {selectedJadwal.kelas}</p>
            </div>

            {/* Body */}
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
                    <p className="text-sm font-semibold">{selectedJadwal.ruangan}</p>
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
              <div className="flex gap-2 justify-end">
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
        selectedModul={selectedModul}
      />

      <JadwalImportCSVModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCSV}
        mataKuliahList={mataKuliahList}
        term={selectedTerm}
      />
    </div>
  );
}
