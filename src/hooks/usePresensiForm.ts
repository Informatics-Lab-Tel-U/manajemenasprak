import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTermStore } from '@/store/useTermStore';
import { getPraktikumList, getPraktikumClasses } from '@/app/actions/presensi';

export interface PresensiComponent {
  enabled: boolean;
  weight: number;
  inputType: 'number' | 'boolean';
}

export interface PresensiFormOptions {
  tp: PresensiComponent;
  jurnal: PresensiComponent;
  tesAkhir: PresensiComponent;
  rate: boolean;
}

export interface KelasSetting {
  tanggalMulai: Date | undefined;
  jumlahPraktikan: number;
  jumlahAsprak: number;
}

export function usePresensiForm() {
  const { activeTerm } = useTermStore();

  // Basic Form State
  const [namaFile, setNamaFile] = useState('presensi');
  const [jumlahModul, setJumlahModul] = useState(8);
  const [globalJumlahPraktikan, setGlobalJumlahPraktikan] = useState(40);
  const [globalJumlahAsprak, setGlobalJumlahAsprak] = useState(4);
  const [kelasSettings, setKelasSettings] = useState<KelasSetting[]>([]);
  const [opsi, setOpsi] = useState<PresensiFormOptions>({
    tp: { enabled: true, weight: 30, inputType: 'number' },
    jurnal: { enabled: true, weight: 40, inputType: 'number' },
    tesAkhir: { enabled: true, weight: 30, inputType: 'number' },
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
        setKelasSettings([]);
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
        setKelasSettings(
          Array.from({ length: res.data.length }).map(() => ({
            tanggalMulai: undefined,
            jumlahPraktikan: globalJumlahPraktikan,
            jumlahAsprak: globalJumlahAsprak,
          }))
        );

        // Auto-set nama file based on praktikum name
        const p = praktikumList.find((p) => p.id === selectedPraktikumId);
        if (p) setNamaFile(`Presensi_${p.nama.replace(/\s+/g, '_')}`);
      } else {
        toast.error('Gagal memuat daftar Kelas');
      }
      setLoadingKelas(false);
    }
    fetchKelas();
  }, [selectedPraktikumId, praktikumList, globalJumlahPraktikan, globalJumlahAsprak]);

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
  }, [selectedJurusan, allFetchedKelas, globalJumlahPraktikan, globalJumlahAsprak]);

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
      setKelasSettings([
        ...kelasSettings,
        ...Array.from({ length: newClasses.length }).map(() => ({
          tanggalMulai: new Date(),
          jumlahPraktikan: globalJumlahPraktikan,
          jumlahAsprak: globalJumlahAsprak,
        })),
      ]);
    }
    setCustomKelasInput('');
  };

  const handleRemoveKelas = (indexToRemove: number) => {
    setKelasNames(kelasNames.filter((_, i) => i !== indexToRemove));
    setKelasSettings(kelasSettings.filter((_, i) => i !== indexToRemove));
  };

  const updateKelasSetting = (index: number, field: keyof KelasSetting, value: any) => {
    const newSettings = [...kelasSettings];
    newSettings[index] = { ...newSettings[index], [field]: value };
    setKelasSettings(newSettings);
  };

  const applyGlobalToAll = () => {
    setKelasSettings(
      kelasSettings.map((s) => ({
        ...s,
        jumlahPraktikan: globalJumlahPraktikan,
        jumlahAsprak: globalJumlahAsprak,
      }))
    );
    toast.success('Parameter global diterapkan ke semua kelas');
  };

  return {
    state: {
      namaFile,
      jumlahModul,
      globalJumlahPraktikan,
      globalJumlahAsprak,
      kelasSettings,
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
      setGlobalJumlahPraktikan,
      setGlobalJumlahAsprak,
      setOpsi,
      setSelectedPraktikumId,
      setSelectedJurusan,
      setCustomKelasInput,
    },
    handlers: {
      handleAddCustomKelas,
      handleRemoveKelas,
      updateKelasSetting,
      applyGlobalToAll,
    },
  };
}
