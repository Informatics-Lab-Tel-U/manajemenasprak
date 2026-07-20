import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { KelasSetting, PresensiFormOptions } from '@/types/presensi';

export function usePresensiState() {
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

  const [selectedPraktikumId, setSelectedPraktikumId] = useState<string>('');
  const [kelasNames, setKelasNames] = useState<string[]>([]);
  const [customKelasInput, setCustomKelasInput] = useState('');
  const [selectedJurusan, setSelectedJurusan] = useState<string>('all');
  const [generateRekapSheet, setGenerateRekapSheet] = useState(false);

  // Derived logic
  const totalWeight =
    (opsi.tp.enabled && opsi.tp.inputType === 'number' ? opsi.tp.weight : 0) +
    (opsi.jurnal.enabled && opsi.jurnal.inputType === 'number' ? opsi.jurnal.weight : 0) +
    (opsi.tesAkhir.enabled && opsi.tesAkhir.inputType === 'number' ? opsi.tesAkhir.weight : 0);

  const isWeightValid = totalWeight === 100 || totalWeight === 0;

  // Handlers
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

  const updateKelasSetting = useCallback((index: number, field: keyof KelasSetting, value: any) => {
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
        jumlahPraktikan: globalJumlahPraktikan,
        jumlahAsprak: globalJumlahAsprak,
      }))
    );
    toast.success('Parameter global diterapkan ke semua kelas');
  }, [globalJumlahPraktikan, globalJumlahAsprak]);

  return {
    // State
    namaFile,
    jumlahModul,
    globalJumlahPraktikan,
    globalJumlahAsprak,
    kelasSettings,
    opsi,
    selectedPraktikumId,
    kelasNames,
    customKelasInput,
    selectedJurusan,
    generateRekapSheet,
    // Derived
    totalWeight,
    isWeightValid,
    // Setters
    setNamaFile,
    setJumlahModul,
    setGlobalJumlahPraktikan,
    setGlobalJumlahAsprak,
    setKelasSettings,
    setOpsi,
    setSelectedPraktikumId,
    setKelasNames,
    setCustomKelasInput,
    setSelectedJurusan,
    setGenerateRekapSheet,
    // Handlers
    handleAddCustomKelas,
    handleRemoveKelas,
    updateKelasSetting,
    applyGlobalToAll,
  };
}
