'use client';

import { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Filter, X, User, Users } from 'lucide-react';
import { Jadwal } from '@/types/database';
import { useJadwal } from '@/hooks/useJadwal';

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
          <p style={{ color: 'var(--text-secondary)' }}>Master Schedule</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* Term Selector */}
          <div>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius)',
                background: 'var(--primary)', // Highlighted
                color: 'white',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {availableTerms.map((t) => (
                <option key={t} value={t} style={{ color: 'black' }}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Room Filter Dropdown */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            >
              <Filter size={16} />
            </div>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              style={{
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                borderRadius: 'var(--radius)',
                background: 'rgba(0,0,0,0.2)',
                color: 'white',
                border: '1px solid var(--card-border)',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '180px',
              }}
            >
              <option value="All Rooms">All Rooms</option>
              {uniqueRooms.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
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
            style={{
              background: selectedDay === day ? 'var(--primary)' : 'transparent',
              color: selectedDay === day ? 'white' : 'var(--text-secondary)',
              border: selectedDay === day ? 'none' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '2rem',
              padding: '0.5rem 1.5rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: 500,
            }}
          >
            {day}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading schedule...
        </div>
      ) : filteredJadwal.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
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
                  <span
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {timeStart}
                  </span>
                  <span
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Sesi {sesi}
                  </span>
                </div>

                {/* Timeline Line */}
                <div
                  style={{ position: 'relative', width: '2px', background: 'var(--card-border)' }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '24px',
                      left: '-5px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)',
                    }}
                  />
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
                        className="card glass"
                        style={{
                          padding: '1rem',
                          cursor: 'pointer',
                          borderLeft: '4px solid var(--secondary)',
                          transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>
                            {jadwal.kelas}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              background: 'rgba(255,255,255,0.1)',
                              padding: '0.1rem 0.5rem',
                              borderRadius: '4px',
                            }}
                          >
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
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <User size={14} />
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {jadwal.dosen || 'Dosen TBD'}
                          </span>
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
            className="card glass"
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
