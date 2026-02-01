'use client';

import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Filter, X, User, Users } from 'lucide-react';
import { Jadwal } from '@/types/database';
import { useJadwal } from '@/hooks/useJadwal';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type GroupedSchedule = {
  [sesi: number]: Jadwal[];
};

export default function JadwalPage() {
  const {
    data: jadwalList,
    terms: availableTerms,
    selectedTerm,
    setSelectedTerm,
    loading,
  } = useJadwal();

  const [selectedDay, setSelectedDay] = useState('SENIN');
  const [selectedRoom, setSelectedRoom] = useState('All Rooms');

  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);

  const uniqueRooms = useMemo(() => {
    const rooms = new Set<string>();
    jadwalList.forEach((j) => {
      if (j.ruangan) rooms.add(j.ruangan);
    });
    return Array.from(rooms).sort();
  }, [jadwalList]);

  const days = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

  const filteredJadwal = useMemo(() => {
    let list = jadwalList;
    if (selectedDay !== 'ALL') {
      list = list.filter((j) => j.hari === selectedDay);
    }
    if (selectedRoom !== 'All Rooms') {
      list = list.filter((j) => j.ruangan === selectedRoom);
    }
    return list;
  }, [jadwalList, selectedDay, selectedRoom]);

  const groupedBySesi = useMemo(() => {
    const groups: GroupedSchedule = {};
    filteredJadwal.forEach((j) => {
      if (!groups[j.sesi]) groups[j.sesi] = [];
      groups[j.sesi].push(j);
    });
    return groups;
  }, [filteredJadwal]);

  const sessions = Object.keys(groupedBySesi)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="container" style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'end',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 className="title-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            Jadwal Praktikum
          </h1>
          <p className="text-muted-foreground">Kelola jadwal praktikum asisten praktikum</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* Term Selector */}
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-[180px] font-medium">
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

          {/* Room Filter Dropdown */}
          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
            <SelectTrigger className="w-[180px]">
              <Filter size={16} className="mr-2" />
              <SelectValue placeholder="All Rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="All Rooms">All Rooms</SelectItem>
                {uniqueRooms.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Day Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--card-border)',
        }}
      >
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-6 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
              selectedDay === day
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading schedule...</div>
      ) : filteredJadwal.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>
            No schedule found for {selectedDay}{' '}
            {selectedRoom !== 'All Rooms' ? `in ${selectedRoom}` : ''}.
          </p>
        </div>
      ) : (
        <div
          className="timeline-container"
          style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
        >
          {sessions.map((sesi) => {
            const items = groupedBySesi[sesi] || [];
            if (items.length === 0) return null;
            const timeStart = items[0]?.jam?.substring(0, 5) || '00:00';

            return (
              <div key={sesi} style={{ display: 'flex', gap: '1.5rem' }}>
                {/* Time Column */}
                <div
                  style={{
                    minWidth: '80px',
                    textAlign: 'right',
                    paddingTop: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.25rem',
                  }}
                >
                  <span className="text-xl font-bold text-foreground">{timeStart}</span>
                  <span className="text-sm text-muted-foreground uppercase tracking-wide">
                    Sesi {sesi}
                  </span>
                </div>

                {/* Timeline Line */}
                <div className="relative w-0.5 bg-border">
                  <div className="absolute top-6 -left-1.5 w-3 h-3 rounded-full bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.2)]" />
                </div>

                {/* Events Grid */}
                <div style={{ flex: 1, paddingBottom: '2rem' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '1rem',
                    }}
                  >
                    {items.map((jadwal) => (
                      <div
                        key={jadwal.id}
                        onClick={() => setSelectedJadwal(jadwal)}
                        className="bg-card/80 backdrop-blur-sm rounded-lg p-4 cursor-pointer border-l-4 border-l-primary transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-md"
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <span className="font-semibold text-primary">{jadwal.kelas}</span>
                          <span className="text-xs bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded">
                            {jadwal.ruangan}
                          </span>
                        </div>
                        <h4
                          style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            marginBottom: '0.5rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {jadwal.mata_kuliah?.nama_lengkap}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User size={14} />
                          <span className="truncate">{jadwal.dosen || 'Dosen TBD'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedJadwal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setSelectedJadwal(null)}
        >
          <div
            className="bg-card/95 backdrop-blur-md rounded-lg shadow-2xl"
            style={{ width: '100%', maxWidth: '500px', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedJadwal(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={24} />
            </button>

            <div style={{ padding: '0.5rem' }}>
              <span
                className="badge badge-purple"
                style={{ marginBottom: '1rem', display: 'inline-block' }}
              >
                {selectedJadwal.mata_kuliah?.program_studi}
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {selectedJadwal.mata_kuliah?.nama_lengkap}
              </h2>
              <p
                style={{
                  fontSize: '1.25rem',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  marginBottom: '2rem',
                }}
              >
                {selectedJadwal.kelas}
              </p>

              <div
                style={{
                  display: 'grid',
                  gap: '1rem',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '1.5rem',
                  borderRadius: 'var(--radius)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Clock className="text-blue-400" size={20} />
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Waktu</p>
                    <p style={{ fontWeight: 500 }}>
                      {selectedJadwal.hari}, {selectedJadwal.jam} (Sesi {selectedJadwal.sesi})
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <MapPin className="text-green-400" size={20} />
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ruangan</p>
                    <p style={{ fontWeight: 500 }}>{selectedJadwal.ruangan || 'Online'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <User className="text-yellow-400" size={20} />
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dosen</p>
                    <p style={{ fontWeight: 500 }}>{selectedJadwal.dosen || '-'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Users className="text-purple-400" size={20} />
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Kebutuhan Asprak
                    </p>
                    <p style={{ fontWeight: 500 }}>{selectedJadwal.total_asprak} Orang</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
