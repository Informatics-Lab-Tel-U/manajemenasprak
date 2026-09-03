/**
 * Konfigurasi Terpusat Jadwal Jaga & Presensi RFID Lab
 * 
 * Aturan Presensi:
 * 1. Senin - Kamis:
 *    - Shift 1: 06:00 - 09:00 (Window tap: 05:45 - 06:59 Hadir, >=07:00 Terlambat)
 *    - Shift 2: 09:00 - 12:00 (Window tap: 08:45 - 09:59 Hadir, >=10:00 Terlambat)
 *    - Shift 3: 12:00 - 15:00 (Window tap: 11:45 - 12:59 Hadir, >=13:00 Terlambat)
 *    - Shift 4: 15:00 - 18:00 (Window tap: 14:45 - 15:59 Hadir, >=16:00 Terlambat)
 * 
 * 2. Jumat - Sabtu:
 *    - Shift 1: 06:30 - 09:30 (Window tap: 06:30 - 06:59 Hadir, >=07:00 Terlambat)
 *    - Shift 2: 09:30 - 12:30 (Window tap: 09:15 - 09:59 Hadir, >=10:00 Terlambat)
 *    - Shift 3: 12:30 - 15:30 (Window tap: 12:15 - 12:59 Hadir, >=13:00 Terlambat)
 *    - Shift 4: 15:30 - 18:30 (Window tap: 15:15 - 15:59 Hadir, >=16:00 Terlambat)
 */

export interface JagaShiftConfig {
  shift: number;
  jam: string;
  startHour: number;
  endHour: number;
  earliestTapHour: number;
  lateThresholdHour: number;
}

export const JAGA_CONFIG = {
  // Senin s/d Kamis
  WEEKDAY_SHIFTS: [
    {
      shift: 1,
      jam: '06:00 - 09:00',
      startHour: 6.0, // 06:00
      endHour: 9.0, // 09:00
      earliestTapHour: 5.75, // 05:45 (15 menit sebelum mulai)
      lateThresholdHour: 6.0 + 59 / 60, // 06:59 (hadir tepat waktu s/d 06:59, >=07:00 terlambat)
    },
    {
      shift: 2,
      jam: '09:00 - 12:00',
      startHour: 9.0, // 09:00
      endHour: 12.0, // 12:00
      earliestTapHour: 8.75, // 08:45 (15 menit sebelum mulai)
      lateThresholdHour: 9.0 + 59 / 60, // 09:59 (hadir tepat waktu s/d 09:59, >=10:00 terlambat)
    },
    {
      shift: 3,
      jam: '12:00 - 15:00',
      startHour: 12.0, // 12:00
      endHour: 15.0, // 15:00
      earliestTapHour: 11.75, // 11:45 (15 menit sebelum mulai)
      lateThresholdHour: 12.0 + 59 / 60, // 12:59 (hadir tepat waktu s/d 12:59, >=13:00 terlambat)
    },
    {
      shift: 4,
      jam: '15:00 - 18:00',
      startHour: 15.0, // 15:00
      endHour: 18.0, // 18:00
      earliestTapHour: 14.75, // 14:45 (15 menit sebelum mulai)
      lateThresholdHour: 15.0 + 59 / 60, // 15:59 (hadir tepat waktu s/d 15:59, >=16:00 terlambat)
    },
  ] as JagaShiftConfig[],

  // Jumat s/d Sabtu
  WEEKEND_SHIFTS: [
    {
      shift: 1,
      jam: '06:30 - 09:30',
      startHour: 6.5, // 06:30
      endHour: 9.5, // 09:30
      earliestTapHour: 6.5, // 06:30 (sesi 1 pagi rentang tap mulai 06:30)
      lateThresholdHour: 6.0 + 59 / 60, // 06:59 (hadir tepat waktu s/d 06:59, >=07:00 terlambat)
    },
    {
      shift: 2,
      jam: '09:30 - 12:30',
      startHour: 9.5, // 09:30
      endHour: 12.5, // 12:30
      earliestTapHour: 9.25, // 09:15 (15 menit sebelum mulai)
      lateThresholdHour: 9.0 + 59 / 60, // 09:59 (hadir tepat waktu s/d 09:59, >=10:00 terlambat)
    },
    {
      shift: 3,
      jam: '12:30 - 15:30',
      startHour: 12.5, // 12:30
      endHour: 15.5, // 15:30
      earliestTapHour: 12.25, // 12:15 (15 menit sebelum mulai)
      lateThresholdHour: 12.0 + 59 / 60, // 12:59 (hadir tepat waktu s/d 12:59, >=13:00 terlambat)
    },
    {
      shift: 4,
      jam: '15:30 - 18:30',
      startHour: 15.5, // 15:30
      endHour: 18.5, // 18:30
      earliestTapHour: 15.25, // 15:15 (15 menit sebelum mulai)
      lateThresholdHour: 15.0 + 59 / 60, // 15:59 (hadir tepat waktu s/d 15:59, >=16:00 terlambat)
    },
  ] as JagaShiftConfig[],
};

export function getJagaShiftList(hari: string): JagaShiftConfig[] {
  const upper = (hari || 'SENIN').toUpperCase();
  const isWeekend = upper === 'JUMAT' || upper === 'SABTU';
  return isWeekend ? JAGA_CONFIG.WEEKEND_SHIFTS : JAGA_CONFIG.WEEKDAY_SHIFTS;
}
