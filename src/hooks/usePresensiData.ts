import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTermStore } from '@/store/useTermStore';
import { getPraktikumList, getPraktikumClasses, getAsprakListByPraktikum } from '@/app/actions/presensi';
import { AsprakEntry, KelasSetting } from '@/types/presensi';

interface UsePresensiDataProps {
  selectedPraktikumId: string;
  selectedJurusan: string;
  kelasNames: string[];
  kelasSettings: KelasSetting[];
  setKelasNames: (names: string[] | ((prev: string[]) => string[])) => void;
  setKelasSettings: (settings: KelasSetting[] | ((prev: KelasSetting[]) => KelasSetting[])) => void;
  setNamaFile: (name: string) => void;
  globalJumlahPraktikan: number;
  globalJumlahAsprak: number;
}

export function usePresensiData({
  selectedPraktikumId,
  selectedJurusan,
  kelasNames,
  kelasSettings,
  setKelasNames,
  setKelasSettings,
  setNamaFile,
  globalJumlahPraktikan,
  globalJumlahAsprak,
}: UsePresensiDataProps) {
  const { activeTerm } = useTermStore();

  const [praktikumList, setPraktikumList] = useState<{ id: string; nama: string }[]>([]);
  const [loadingPraktikum, setLoadingPraktikum] = useState(false);

  const [allFetchedKelas, setAllFetchedKelas] = useState<string[]>([]);
  const [loadingKelas, setLoadingKelas] = useState(false);
  const [availableJurusans, setAvailableJurusans] = useState<string[]>([]);

  const [asprakList, setAsprakList] = useState<AsprakEntry[]>([]);
  const [loadingAsprak, setLoadingAsprak] = useState(false);

  // 1. Fetch Praktikum List
  useEffect(() => {
    async function fetchPraktikum() {
      if (!activeTerm) return;
      setLoadingPraktikum(true);
      const res = await getPraktikumList(activeTerm);
      if (res.success && res.data) {
        setPraktikumList(res.data);
      } else {
        toast.error('Gagal memuat daftar Praktikum');
      }
      setLoadingPraktikum(false);
    }
    fetchPraktikum();
  }, [activeTerm]);

  // 2. Fetch Kelas
  useEffect(() => {
    async function fetchKelas() {
      if (!selectedPraktikumId) {
        setKelasNames([]);
        setKelasSettings([]);
        setAsprakList([]);
        return;
      }
      setLoadingKelas(true);
      const res = await getPraktikumClasses(selectedPraktikumId);
      if (res.success && res.data) {
        setAllFetchedKelas(res.data);

        const jurusansSet = new Set<string>();
        res.data.forEach((k) => {
          const base = k.split('-')[0];
          if (k.endsWith('PJJ')) {
            jurusansSet.add(`${base} PJJ`);
          } else {
            jurusansSet.add(base);
          }
        });
        const jurusans = Array.from(jurusansSet).filter(Boolean).sort();
        setAvailableJurusans(jurusans);

        // Auto-set nama file based on praktikum name
        const p = praktikumList.find((p) => p.id === selectedPraktikumId);
        if (p) setNamaFile(`Presensi_${p.nama.replace(/\s+/g, '_')}`);
      } else {
        toast.error('Gagal memuat daftar Kelas');
      }
      setLoadingKelas(false);
    }
    fetchKelas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPraktikumId, praktikumList]);

  // 3. Filter Kelas by Jurusan
  useEffect(() => {
    if (allFetchedKelas.length === 0) return;

    const customClasses = kelasNames.filter((k) => !allFetchedKelas.includes(k));
    const customSettings = customClasses.map((k) => {
      const idx = kelasNames.indexOf(k);
      return idx !== -1 ? kelasSettings[idx] : {
        tanggalMulai: undefined,
        jumlahPraktikan: globalJumlahPraktikan,
        jumlahAsprak: globalJumlahAsprak,
      };
    });

    let filtered: string[] = [];

    if (selectedJurusan === 'all') {
      filtered = [...allFetchedKelas];
    } else if (selectedJurusan.endsWith(' PJJ')) {
      const base = selectedJurusan.split(' ')[0];
      filtered = allFetchedKelas.filter((k) => k.startsWith(`${base}-`) && k.endsWith('PJJ'));
    } else {
      filtered = allFetchedKelas.filter((k) => k.startsWith(`${selectedJurusan}-`) && !k.endsWith('PJJ'));
    }

    const newSettings = Array.from({ length: filtered.length }).map(() => ({
      tanggalMulai: undefined,
      jumlahPraktikan: globalJumlahPraktikan,
      jumlahAsprak: globalJumlahAsprak,
    }));

    setKelasNames([...filtered, ...customClasses]);
    setKelasSettings([...newSettings, ...customSettings]);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJurusan, allFetchedKelas, globalJumlahPraktikan, globalJumlahAsprak]);

  // 4. Fetch Asprak List
  useEffect(() => {
    async function fetchAsprak() {
      if (!selectedPraktikumId) {
        setAsprakList([]);
        return;
      }
      setLoadingAsprak(true);
      const res = await getAsprakListByPraktikum(selectedPraktikumId);
      if (res.success && res.data) {
        setAsprakList(res.data);
      } else {
        setAsprakList([]);
      }
      setLoadingAsprak(false);
    }
    fetchAsprak();
  }, [selectedPraktikumId]);

  return {
    praktikumList,
    loadingPraktikum,
    loadingKelas,
    availableJurusans,
    asprakList,
    loadingAsprak,
  };
}
