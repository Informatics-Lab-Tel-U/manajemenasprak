import { useMemo } from 'react';
import { Jadwal, JadwalPengganti } from '@/types/database';
import { DAYS, STATIC_SESSIONS } from '@/constants';

export type ProgramType = 'REGULER' | 'PJJ';

interface UseScheduleDataProps {
  rawJadwalList: Jadwal[];
  jadwalPengganti?: JadwalPengganti[];
  selectedModul?: string;
  programType?: ProgramType;
  filterDay?: string;
}

export function useScheduleData({
  rawJadwalList,
  jadwalPengganti = [],
  selectedModul = 'Default',
  programType = 'REGULER',
  filterDay,
}: UseScheduleDataProps) {
  const processedJadwalList = useMemo(() => {
    let combined = rawJadwalList;

    if (selectedModul !== 'Default' && jadwalPengganti.length > 0) {
      combined = rawJadwalList.map((j) => {
        const substitute = jadwalPengganti.find((jp) => jp.id_jadwal === j.id);
        if (substitute) {
          return {
            ...j,
            ruangan: substitute.ruangan,
            jam: substitute.jam,
            hari: substitute.hari,
            sesi: substitute.sesi,
            tanggal: substitute.tanggal,
            is_pengganti: true,
          };
        }
        return j;
      });
    }

    return combined.filter((j) => {
      if (filterDay && j.hari?.toUpperCase() !== filterDay.toUpperCase()) return false;

      const isPJJ =
        j.mata_kuliah?.program_studi?.toUpperCase().includes('PJJ') ||
        j.kelas?.toUpperCase().includes('PJJ');

      return programType === 'PJJ' ? isPJJ : !isPJJ;
    });
  }, [rawJadwalList, jadwalPengganti, selectedModul, programType, filterDay]);

  const uniqueRooms = useMemo(() => {
    const rooms = new Set<string>();
    let hasEmptyRoom = false;
    processedJadwalList.forEach((j) => {
      if (j.ruangan) {
        rooms.add(j.ruangan);
      } else {
        hasEmptyRoom = true;
      }
    });

    const sortedRooms = Array.from(rooms).sort();
    if (hasEmptyRoom) {
      sortedRooms.push('Tanpa Ruangan');
    }
    return sortedRooms;
  }, [processedJadwalList]);

  const visibleDays = useMemo(() => {
    if (filterDay) return [filterDay.toUpperCase()];

    const days = new Set<string>();
    if (programType === 'PJJ') {
      days.add('SABTU');
    } else {
      DAYS.forEach((d) => days.add(d));
    }

    processedJadwalList.forEach((j) => {
      if (j.hari) days.add(j.hari.toUpperCase());
    });

    const dayOrder = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'];
    return Array.from(days).sort((a, b) => {
      const idxA = dayOrder.indexOf(a);
      const idxB = dayOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  }, [programType, processedJadwalList, filterDay]);

  const scheduleMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, Record<string, Jadwal[]>>> = {};

    processedJadwalList.forEach((j) => {
      if (!j.hari) return;

      const hari = j.hari.toUpperCase();
      const staticForDay = STATIC_SESSIONS[hari] || [];
      const staticJamToSesi = new Map<string, number>();
      staticForDay.forEach((s) => staticJamToSesi.set(s.jam, s.sesi));

      let jamStr = j.jam || '';
      if (jamStr.split(':').length === 3) {
        jamStr = jamStr.split(':').slice(0, 2).join(':');
      }

      let sesi = j.sesi;
      if (!sesi || sesi === 0) {
        if (jamStr && staticJamToSesi.has(jamStr)) {
          sesi = staticJamToSesi.get(jamStr)!;
        }
      }

      const rowKey =
        sesi !== null && sesi !== undefined && sesi !== 0 ? sesi.toString() : jamStr || 'Unknown';
      const roomKey = j.ruangan || 'Tanpa Ruangan';

      if (!matrix[hari]) matrix[hari] = {};
      if (!matrix[hari][rowKey]) matrix[hari][rowKey] = {};
      if (!matrix[hari][rowKey][roomKey]) matrix[hari][rowKey][roomKey] = [];

      matrix[hari][rowKey][roomKey].push({
        ...j,
        jam: jamStr,
        sesi: sesi ?? undefined,
      } as Jadwal);
    });

    return matrix;
  }, [processedJadwalList]);

  const dynamicSessionsByDay = useMemo(() => {
    const result: Record<string, { sesi: number | null; jam: string; rowKey: string }[]> = {};

    const parseTime = (jamStr: string) => {
      const m = jamStr.match(/(\d{1,2}):(\d{2})/);
      if (m) return parseInt(m[1]) * 60 + parseInt(m[2]);
      return 9999;
    };

    visibleDays.forEach((day) => {
      const staticForDay = STATIC_SESSIONS[day] || [];
      const staticJamToSesi = new Map<string, number>();
      staticForDay.forEach((s) => staticJamToSesi.set(s.jam, s.sesi));

      const sessionsAsKeys = new Map<
        string,
        { sesi: number | null; jam: string; rowKey: string }
      >();

      staticForDay.forEach((s) => {
        if (s.sesi !== 5) {
          const rowKey = s.sesi !== null && s.sesi !== undefined ? s.sesi.toString() : s.jam;
          sessionsAsKeys.set(rowKey, { sesi: s.sesi, jam: s.jam, rowKey });
        }
      });

      const daySchedules = processedJadwalList.filter((j) => j.hari?.toUpperCase() === day);
      daySchedules.forEach((j) => {
        let jamStr = j.jam || '';
        if (jamStr.split(':').length === 3) jamStr = jamStr.split(':').slice(0, 2).join(':');

        let sesi = j.sesi;
        if (!sesi || sesi === 0) {
          if (jamStr && staticJamToSesi.has(jamStr)) sesi = staticJamToSesi.get(jamStr)!;
        }

        const rowKey =
          sesi !== null && sesi !== undefined && sesi !== 0 ? sesi.toString() : jamStr || 'Unknown';

        if (!sessionsAsKeys.has(rowKey)) {
          sessionsAsKeys.set(rowKey, { sesi: sesi || null, jam: jamStr || '-', rowKey });
        } else {
          const existing = sessionsAsKeys.get(rowKey)!;
          if (!existing.jam || existing.jam === '-' || (!sesi && existing.sesi === null)) {
            sessionsAsKeys.set(rowKey, {
              sesi: sesi || existing.sesi,
              jam: jamStr || existing.jam,
              rowKey,
            });
          }
        }
      });

      const sortedSessions = Array.from(sessionsAsKeys.values()).sort((a, b) => {
        const timeA = parseTime(a.jam);
        const timeB = parseTime(b.jam);
        if (timeA !== 9999 || timeB !== 9999) return timeA - timeB;
        return (a.sesi ?? 999) - (b.sesi ?? 999);
      });

      const lastStaticSession =
        staticForDay.length > 0 ? staticForDay[staticForDay.length - 1] : null;
      result[day] = lastStaticSession
        ? sortedSessions.filter((s) => {
            if (s.sesi !== lastStaticSession.sesi) return true;
            const dayMatrix = scheduleMatrix[day];
            return dayMatrix && dayMatrix[s.rowKey] && Object.keys(dayMatrix[s.rowKey]).length > 0;
          })
        : sortedSessions;
    });

    return result;
  }, [visibleDays, processedJadwalList, scheduleMatrix]);

  return {
    processedJadwalList,
    uniqueRooms,
    visibleDays,
    scheduleMatrix,
    dynamicSessionsByDay,
  };
}
