/**
 * Application constants
 */

export const ACTIVE_YEARS_THRESHOLD = 6;

export const DAYS = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

export const ROOMS = [
  'TULT 0604',
  'TULT 0605',
  'TULT 0617',
  'TULT 0618',
  'TULT 0704',
  'TULT 0705',
  'TULT 0712',
  'TULT 0713',
];

export const STATIC_SESSIONS: Record<string, { sesi: number; jam: string }[]> = {
  SENIN: [
    { sesi: 1, jam: '06:30' },
    { sesi: 2, jam: '09:30' },
    { sesi: 3, jam: '12:30' },
    { sesi: 4, jam: '15:30' },
  ],
  SELASA: [
    { sesi: 1, jam: '06:30' },
    { sesi: 2, jam: '09:30' },
    { sesi: 3, jam: '12:30' },
    { sesi: 4, jam: '15:30' },
  ],
  RABU: [
    { sesi: 1, jam: '06:30' },
    { sesi: 2, jam: '09:30' },
    { sesi: 3, jam: '12:30' },
    { sesi: 4, jam: '15:30' },
  ],
  KAMIS: [
    { sesi: 1, jam: '06:30' },
    { sesi: 2, jam: '09:30' },
    { sesi: 3, jam: '12:30' },
    { sesi: 4, jam: '15:30' },
  ],
  JUMAT: [
    { sesi: 1, jam: '07:30' },
    { sesi: 3, jam: '13:30' }, // Sesi 3 as requested
    { sesi: 4, jam: '16:30' }, // Sesi 4 as requested
  ],
  SABTU: [
    { sesi: 1, jam: '07:30' },
    { sesi: 2, jam: '10:30' },
    { sesi: 3, jam: '13:30' },
    { sesi: 4, jam: '16:30' },
  ],
};
