import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useTermStore } from '@/store/useTermStore';
import { getPraktikumList, getPraktikumClasses, getAsprakListByPraktikum } from '@/app/actions/presensi';
import { AsprakEntry, KelasSetting, PresensiFormOptions, ThemeKey } from '@/types/presensi';

export function usePresensi() {
  const { activeTerm } = useTermStore();

  // --- UI State ---
  const [namaFile, setNamaFile] = useState('presensi');
  const [jumlahModul, setJumlahModul] = useState(8);
  const [globalJumlahPraktikan, setGlobalJumlahPraktikan] = useState(40);
  const [globalJumlahAsprak, setGlobalJumlahAsprak] = useState(4);
  const [globalTanggalMulai, setGlobalTanggalMulai] = useState<Date | undefined>(new Date());
  const [theme, setTheme] = useState<ThemeKey>('BLUE');
  const [opsi, setOpsi] = useState<PresensiFormOptions>({
    tp: { enabled: true, weight: 30, inputType: 'number' },
    jurnal: { enabled: true, weight: 40, inputType: 'number' },
    tesAkhir: { enabled: true, weight: 30, inputType: 'number' },
    rate: true,
  });

  const [selectedPraktikumId, setSelectedPraktikumId] = useState<string>('');
  const [selectedJurusan, setSelectedJurusan] = useState<string>('all');
  const [generateRekapSheet, setGenerateRekapSheet] = useState(true);

  // --- Class/Asprak Data State ---
  const [kelasNames, setKelasNames] = useState<string[]>([]);
  const [kelasSettings, setKelasSettings] = useState<KelasSetting[]>([]);
  const [customKelasInput, setCustomKelasInput] = useState('');

  // --- External Data State ---
  const [praktikumList, setPraktikumList] = useState<{ id: string; nama: string }[]>([]);
  const [loadingPraktikum, setLoadingPraktikum] = useState(false);
  const [allFetchedKelas, setAllFetchedKelas] = useState<string[]>([]);
  const [loadingKelas, setLoadingKelas] = useState(false);
  const [availableJurusans, setAvailableJurusans] = useState<string[]>([]);
  const [asprakList, setAsprakList] = useState<AsprakEntry[]>([]);
  const [loadingAsprak, setLoadingAsprak] = useState(false);

  // Derived logic
  const totalWeight =
    (opsi.tp.enabled && opsi.tp.inputType === 'number' ? opsi.tp.weight : 0) +
    (opsi.jurnal.enabled && opsi.jurnal.inputType === 'number' ? opsi.jurnal.weight : 0) +
    (opsi.tesAkhir.enabled && opsi.tesAkhir.inputType === 'number' ? opsi.tesAkhir.weight : 0);

  const isWeightValid = totalWeight === 100 || totalWeight === 0;

  // --- Handlers ---
  const handleAddCustomKelas = useCallback(() => {
    if (!customKelasInput.trim()) return;
    const kelasNamesSet = new Set(kelasNames);
    const newClasses = customKelasInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c && !kelasNamesSet.has(c));
      
    if (newClasses.length > 0) {
      setKelasNames((prev) => [...prev, ...newClasses]);
      setKelasSettings((prev) => [
        ...prev,
        ...Array.from({ length: newClasses.length }).map(() => ({
          tanggalMulai: new Date(),
          jumlahPraktikan: globalJumlahPraktikan,
          jumlahAsprak: globalJumlahAsprak,
        })),
      ]);
    }
    setCustomKelasInput('');
  }, [customKelasInput, kelasNames, globalJumlahPraktikan, globalJumlahAsprak]);

  const handleRemoveKelas = useCallback((indexToRemove: number) => {
    setKelasNames((prev) => prev.filter((_, i) => i !== indexToRemove));
    setKelasSettings((prev) => prev.filter((_, i) => i !== indexToRemove));
  }, []);

  const updateKelasSetting = useCallback(<K extends keyof KelasSetting>(index: number, field: K, value: KelasSetting[K]) => {
    setKelasSettings((prev) => {
      const newSettings = [...prev];
      newSettings[index] = { ...newSettings[index], [field]: value };
      return newSettings;
    });
  }, []);

  const applyGlobalToAll = useCallback(() => {
    setKelasSettings((prev) =>
      prev.map((s) => ({
        ...s,
        tanggalMulai: globalTanggalMulai !== undefined ? globalTanggalMulai : s.tanggalMulai,
        jumlahPraktikan: globalJumlahPraktikan,
        jumlahAsprak: globalJumlahAsprak,
      }))
    );
    toast.success('Parameter global diterapkan ke semua kelas');
  }, [globalJumlahPraktikan, globalJumlahAsprak, globalTanggalMulai]);

  // --- Effects ---

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

  // 2. Fetch Kelas & Auto-set nama file
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
  }, [selectedPraktikumId, praktikumList]);

  const latestKelasNames = useRef(kelasNames);
  useEffect(() => {
    latestKelasNames.current = kelasNames;
  }, [kelasNames]);

  // 3. Filter Kelas by Jurusan
  useEffect(() => {
    if (allFetchedKelas.length === 0) return;

    const fetchedSet = new Set(allFetchedKelas);
    const prevNames = latestKelasNames.current;
    
    const customClasses = prevNames.filter((k) => !fetchedSet.has(k));
    
    let filtered: string[] = [];
    if (selectedJurusan === 'all') {
      filtered = [...allFetchedKelas];
    } else if (selectedJurusan.endsWith(' PJJ')) {
      const base = selectedJurusan.split(' ')[0];
      filtered = allFetchedKelas.filter((k) => k.startsWith(`${base}-`) && k.endsWith('PJJ'));
    } else {
      filtered = allFetchedKelas.filter((k) => k.startsWith(`${selectedJurusan}-`) && !k.endsWith('PJJ'));
    }

    const nextKelasNames = [...filtered, ...customClasses];
    setKelasNames(nextKelasNames);
    
    setKelasSettings((prevSettings) => {
      const customSettings = customClasses.map((k) => {
        const idx = prevNames.indexOf(k);
        return idx !== -1 ? prevSettings[idx] : {
          tanggalMulai: undefined,
          jumlahPraktikan: globalJumlahPraktikan,
          jumlahAsprak: globalJumlahAsprak,
        };
      });
      
      const newSettings = Array.from({ length: filtered.length }).map(() => ({
        tanggalMulai: undefined,
        jumlahPraktikan: globalJumlahPraktikan,
        jumlahAsprak: globalJumlahAsprak,
      }));
      
      return [...newSettings, ...customSettings];
    });
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
    namaFile,
    jumlahModul,
    globalJumlahPraktikan,
    globalJumlahAsprak,
    globalTanggalMulai,
    theme,
    opsi,
    selectedPraktikumId,
    selectedJurusan,
    generateRekapSheet,
    kelasNames,
    kelasSettings,
    customKelasInput,
    praktikumList,
    loadingPraktikum,
    allFetchedKelas,
    loadingKelas,
    availableJurusans,
    asprakList,
    loadingAsprak,
    totalWeight,
    isWeightValid,
    setNamaFile,
    setJumlahModul,
    setGlobalJumlahPraktikan,
    setGlobalJumlahAsprak,
    setGlobalTanggalMulai,
    setTheme,
    setOpsi,
    setSelectedPraktikumId,
    setSelectedJurusan,
    setGenerateRekapSheet,
    setCustomKelasInput,
    handleAddCustomKelas,
    handleRemoveKelas,
    updateKelasSetting,
    applyGlobalToAll,
  };
}
