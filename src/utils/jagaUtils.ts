import { getJagaShiftList } from '@/constants/jagaConfig';

export const getJagaShiftsByDay = (hari: string) => {
  return getJagaShiftList(hari).map((s) => ({
    shift: s.shift,
    jam: s.jam,
  }));
};

export const getShiftTimeString = (hari: string, shift: number) => {
  const shifts = getJagaShiftsByDay(hari);
  const found = shifts.find((s) => s.shift === shift);
  return found ? found.jam : 'Unknown';
};

// Only ADMIN / SUPER ADMIN is allowed to input or edit Jadwal Jaga
export const canInputJagaForModul = (
  _targetModul: number,
  _konfigurasiModul: { modul: number; tanggal_mulai: string | null }[],
  role?: string
) => {
  return role === 'SUPER ADMIN' || role === 'ADMIN';
};
