import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTermStore } from '@/store/useTermStore';
import { getPraktikumList, getPraktikumClasses } from '@/app/actions/presensi';

export interface PresensiFormOptions {
  tp: boolean;
  jurnal: boolean;
  tesAkhir: boolean;
  rate: boolean;
}

export function usePresensiForm() {
  const { activeTerm } = useTermStore();

  // Basic Form State
  const [namaFile, setNamaFile] = useState('presensi');
  const [jumlahModul, setJumlahModul] = useState(8);
  const [tanggalMulai, setTanggalMulai] = useState<Date[]>([]);
  const [opsi, setOpsi] = useState<PresensiFormOptions>({
    tp: true,
    jurnal: true,
    tesAkhir: true,
    rate: true,
  });

  // Praktikum Data State
  const [praktikumList, setPraktikumList] = useState<{ id: string; nama: string }[]>([]);
  const [selectedPraktikumId, setSelectedPraktikumId] = useState<string>('');
  const [loadingPraktikum, setLoadingPraktikum] = useState(false);

  // Kelas & Jurusan State
  const [allFetchedKelas, setAllFetchedKelas] = useState<string[]>([]);
  const [kelasNames, setKelasNames] = useState<string[]>([]);
  const [loadingKelas, setLoadingKelas] = useState(false);
  const [customKelasInput, setCustomKelasInput] = useState('');
  const [availableJurusans, setAvailableJurusans] = useState<string[]>([]);
  const [selectedJurusan, setSelectedJurusan] = useState<string>('all');

  // 1. Fetch Praktikum List when activeTerm changes
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

  // 2. Fetch Kelas when selectedPraktikumId changes
  useEffect(() => {
    async function fetchKelas() {
      if (!selectedPraktikumId) {
        setKelasNames([]);
        setTanggalMulai([]);
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
        setSelectedJurusan('all');

        setKelasNames(res.data);
        setTanggalMulai(Array.from({ length: res.data.length }));

        // Auto-set nama file based on praktikum name
        const p = praktikumList.find((p) => p.id === selectedPraktikumId);
        if (p) setNamaFile(`Presensi_${p.nama.replace(/\s+/g, '_')}`);
      } else {
        toast.error('Gagal memuat daftar Kelas');
      }
      setLoadingKelas(false);
    }
    fetchKelas();
  }, [selectedPraktikumId, praktikumList]);

  // 3. Filter Kelas by Jurusan
  useEffect(() => {
    if (allFetchedKelas.length === 0) return;

    if (selectedJurusan === 'all') {
      setKelasNames(allFetchedKelas);
      setTanggalMulai(Array.from({ length: allFetchedKelas.length }));
    } else {
      const filtered = allFetchedKelas.filter((k) => k.startsWith(`${selectedJurusan}-`));
      setKelasNames(filtered);
      setTanggalMulai(Array.from({ length: filtered.length }));
    }
  }, [selectedJurusan, allFetchedKelas]);

  // Handlers
  const handleAddCustomKelas = () => {
    if (!customKelasInput.trim()) return;
    const kelasNamesSet = new Set(kelasNames);
    const newClasses = customKelasInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c && !kelasNamesSet.has(c));
      
    if (newClasses.length > 0) {
      setKelasNames([...kelasNames, ...newClasses]);
      setTanggalMulai([
        ...tanggalMulai,
        ...Array.from({ length: newClasses.length }).map(() => new Date()),
      ]);
    }
    setCustomKelasInput('');
  };

  const handleRemoveKelas = (indexToRemove: number) => {
    setKelasNames(kelasNames.filter((_, i) => i !== indexToRemove));
    setTanggalMulai(tanggalMulai.filter((_, i) => i !== indexToRemove));
  };

  const setTanggal = (index: number, date: Date | undefined) => {
    if (!date) return;
    const newDates = [...tanggalMulai];
    newDates[index] = date;
    setTanggalMulai(newDates);
  };

  return {
    state: {
      namaFile,
      jumlahModul,
      tanggalMulai,
      opsi,
      praktikumList,
      selectedPraktikumId,
      loadingPraktikum,
      kelasNames,
      loadingKelas,
      customKelasInput,
      availableJurusans,
      selectedJurusan,
    },
    setters: {
      setNamaFile,
      setJumlahModul,
      setOpsi,
      setSelectedPraktikumId,
      setSelectedJurusan,
      setCustomKelasInput,
    },
    handlers: {
      handleAddCustomKelas,
      handleRemoveKelas,
      setTanggal,
    },
  };
}
