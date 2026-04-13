export const getJagaShiftsByDay = (hari: string) => {
  const upperDay = (hari || 'SENIN').toUpperCase();
  const isJumatSabtu = upperDay === 'JUMAT' || upperDay === 'SABTU';

  if (isJumatSabtu) {
    return [
      { shift: 1, jam: '06:30 - 09:30' },
      { shift: 2, jam: '09:30 - 12:30' },
      { shift: 3, jam: '12:30 - 15:30' },
      { shift: 4, jam: '15:30 - 18:30' },
    ];
  }

  return [
    { shift: 1, jam: '06:00 - 09:00' },
    { shift: 2, jam: '09:00 - 12:00' },
    { shift: 3, jam: '12:00 - 15:00' },
    { shift: 4, jam: '15:00 - 18:00' },
  ];
};

export const getShiftTimeString = (hari: string, shift: number) => {
  const shifts = getJagaShiftsByDay(hari);
  const found = shifts.find(s => s.shift === shift);
  return found ? found.jam : 'Unknown';
};

// Check if user is allowed to input for target Modul based on konfigurasi_modul Start Date.
export const canInputJagaForModul = (targetModul: number, konfigurasiModul: { modul: number, tanggal_mulai: string | null }[], role?: string) => {
  if (role === 'SUPER ADMIN' || role === 'ADMIN') return true;

  if (targetModul <= 1) return true; // Modul 1 is always unlocked

  // We find the start date of the TARGET modul (not previous modul)
  // Actually, the user rule: "kalau W4 nya 2 minggu atau 3 minggu ya berarti ambil sabtu minggu terakhir".
  // The logic to "cek dari tanggal_mulai modul, di hari sabtu".
  // Meaning if we want to input for W5, we must be past the Saturday before W5's tanggal_mulai.
  // We can look at `tanggal_mulai` of the target modul.
  const targetConfig = konfigurasiModul.find(m => m.modul === targetModul);
  if (!targetConfig || !targetConfig.tanggal_mulai) return false;

  const targetDate = new Date(targetConfig.tanggal_mulai);
  
  // Saturday before the target date
  // targetDate is usually Monday. So Saturday is 2 days before.
  const saturdayBefore = new Date(targetDate);
  const offset = saturdayBefore.getDay() === 1 ? -2 : (6 - saturdayBefore.getDay());
  saturdayBefore.setDate(saturdayBefore.getDate() + offset);
  
  const now = new Date();
  
  // They can input IF now >= saturdayBefore (or if it's the exact same day)
  saturdayBefore.setHours(0,0,0,0);
  
  return now.getTime() >= saturdayBefore.getTime();
}
