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
import { Filter, X, Clock, MapPin, User, Users, ChevronRight } from 'lucide-react';
import { Jadwal } from '@/types/database';

// Helper to generate consistent colors for courses
const getCourseColor = (name: string) => {
  const colors = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#22c55e', // green-500
    '#06b6d4', // cyan-500
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#a855f7', // purple-500
    '#ec4899', // pink-500
    '#f43f5e', // rose-500
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function JadwalPage() {
  const {
    data: jadwalList,
    terms: availableTerms,
    selectedTerm,
    setSelectedTerm,
    moduls,
    selectedModul,
    setSelectedModul,
    loading,
  } = useJadwal();

  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);
  const [showSessionId, setShowSessionId] = useState(false);

  // 1. Get Unique Rooms (Sorted)
  const uniqueRooms = useMemo(() => {
    const rooms = new Set<string>();
    jadwalList.forEach((j) => {
      if (j.ruangan) rooms.add(j.ruangan);
    });
    return Array.from(rooms).sort();
  }, [jadwalList]);

  // 2. Structure Data
  const days = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

  const uniqueSessions = useMemo(() => {
    const map = new Map<number, string>();
    jadwalList.forEach((j) => {
      if (j.sesi && j.jam) {
        map.set(j.sesi, j.jam.substring(0, 5));
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([sesi, jam]) => ({ sesi, jam }));
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

  return (
    <div className="container min-h-screen p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold title-gradient">Jadwal Praktikum</h1>
          <p className="text-muted-foreground text-sm">Overview jadwal per ruangan</p>
        </div>

        <div className="flex gap-5">
          <Select value={selectedModul} onValueChange={setSelectedModul}>
            <SelectTrigger className="w-[180px]">
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
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px] gap-2 text-muted-foreground animate-pulse">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span>Loading schedule data...</span>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="p-2 border-r border-border text-center font-bold min-w-[60px] text-xs uppercase text-muted-foreground">
                  Hari
                </th>
                <th
                  className="p-2 border-r border-border text-center font-bold min-w-[60px] text-xs uppercase text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors select-none group"
                  onClick={() => setShowSessionId(!showSessionId)}
                  title="Click to toggle between Time and Session ID"
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
              {days.map((day) => {
                if (uniqueSessions.length === 0) return null;

                return uniqueSessions.map((session, sessionIndex) => {
                  const isFirstRow = sessionIndex === 0;

                  return (
                    <tr
                      key={`${day}-${session.sesi}`}
                      className="hover:bg-muted/30 transition-colors border-b border-border/50"
                    >
                      {isFirstRow && (
                        <td
                          rowSpan={uniqueSessions.length}
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
              <button
                onClick={() => setSelectedJadwal(null)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              >
                <X size={20} />
              </button>

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
                <button className="px-4 py-2 rounded-lg border-2 border-primary text-primary font-medium text-sm hover:bg-primary/10 transition-colors">
                  Ganti Jadwal
                </button>

                <button
                  onClick={() => setSelectedJadwal(null)}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
