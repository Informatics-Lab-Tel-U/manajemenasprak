import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTermStore } from '@/store/useTermStore';
import { getPraktikumList, getPraktikumClasses, getAsprakListByPraktikum } from '@/app/actions/presensi';
import { AsprakEntry, KelasSetting } from '@/types/presensi';

interface UsePresensiDataProps {
  selectedPraktikumId: string;
  selectedJurusan: string;
  setKelasNames: (names: string[] | ((prev: string[]) => string[])) => void;
  setKelasSettings: (settings: KelasSetting[] | ((prev: KelasSetting[]) => KelasSetting[])) => void;
  setNamaFile: (name: string) => void;
  globalJumlahPraktikan: number;
  globalJumlahAsprak: number;
}

export function usePresensiData({
  selectedPraktikumId,
  selectedJurusan,
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

        const jurusans = Array.from(new Set(res.data.map((k) => k.split('-')[0])))
          .filter(Boolean)
          .sort();
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

    if (selectedJurusan === 'all') {
      setKelasNames(allFetchedKelas);
      setKelasSettings(
        Array.from({ length: allFetchedKelas.length }).map(() => ({
          tanggalMulai: undefined,
          jumlahPraktikan: globalJumlahPraktikan,
          jumlahAsprak: globalJumlahAsprak,
        }))
      );
    } else {
      const filtered = allFetchedKelas.filter((k) => k.startsWith(`${selectedJurusan}-`));
      setKelasNames(filtered);
      setKelasSettings(
        Array.from({ length: filtered.length }).map(() => ({
          tanggalMulai: undefined,
          jumlahPraktikan: globalJumlahPraktikan,
          jumlahAsprak: globalJumlahAsprak,
        }))
      );
    }
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
