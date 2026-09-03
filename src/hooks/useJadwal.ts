/* eslint-disable react-doctor/exhaustive-deps */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Jadwal, MataKuliah } from '@/types/database';
import * as jadwalFetcher from '@/lib/fetchers/jadwalFetcher';
import type { CreateJadwalInput, UpdateJadwalInput } from '@/services/jadwalService';
import { useTermStore } from '@/store/useTermStore';

const moduls = [
  'Default',
  'Modul 1',
  'Modul 2',
  'Modul 3',
  'Modul 4',
  'Modul 5',
  'Modul 6',
  'Modul 7',
  'Modul 8',
  'Modul 9',
  'Modul 10',
  'Modul 11',
  'Modul 12',
  'Modul 13',
  'Modul 14',
  'Modul 15',
  'Modul 16',
];


export function useJadwal(
  initialTerm?: string,
  initialData?: {
    jadwal?: Jadwal[];
    terms?: string[];
    mataKuliah?: MataKuliah[];
  }
) {
  const [data, setData] = useState<Jadwal[]>(initialData?.jadwal || []);
  const { activeTerm } = useTermStore();
  const selectedTerm = activeTerm || '';
  const [selectedModul, setSelectedModul] = useState('Default');
  const [loading, setLoading] = useState(!initialData?.jadwal);
  const [error, setError] = useState<Error | null>(null);
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>(initialData?.mataKuliah || []);
  const [jadwalPengganti, setJadwalPengganti] = useState<any[]>([]);

  const fetchMataKuliah = useCallback(async () => {
    if (!selectedTerm) return;
    try {
      const res = await fetch(`/api/mata-kuliah?term=${selectedTerm}`);
      if (res.ok) {
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          const flatMks = json.data.flatMap((group: any) => group.items || []);
          setMataKuliahList(flatMks);
        }
      }
    } catch (e: any) {
      console.error('Failed to fetch mata kuliah list for term:', e);
    }
  }, [selectedTerm]);

  const fetchJadwal = useCallback(async () => {
    if (!selectedTerm) return;

    setLoading(true);
    setError(null);
    try {
      const result = await jadwalFetcher.fetchJadwalByTerm(selectedTerm);
      if (result.ok && result.data) {
        setData(result.data);
      } else {
        setError(new Error(result.error || 'Failed to fetch jadwal'));
      }

      if (selectedModul === 'Default') {
        setJadwalPengganti([]);
      } else {
        const modulNum = Number.parseInt(selectedModul.replace('Modul ', ''));
        const penggantiResult = await jadwalFetcher.fetchJadwalPengganti(modulNum);
        if (penggantiResult.ok && penggantiResult.data) {
          setJadwalPengganti(penggantiResult.data);
        }
      }
    } catch (e: any) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [selectedTerm, selectedModul]);

  const addJadwal = async (input: CreateJadwalInput) => {
    setLoading(true);
    const result = await jadwalFetcher.createJadwal(input);
    if (result.ok) {
      await fetchJadwal();
    } else {
      setLoading(false);
    }
    return result;
  };

  const editJadwal = async (input: UpdateJadwalInput) => {
    setLoading(true);
    const result = await jadwalFetcher.updateJadwal(input);
    if (result.ok) {
      await fetchJadwal();
    } else {
      setLoading(false);
    }
    return result;
  };

  const upsertPengganti = async (input: any) => {
    setLoading(true);
    const result = await jadwalFetcher.upsertJadwalPengganti(input);
    if (result.ok) {
      await fetchJadwal();
    } else {
      setLoading(false);
    }
    return result;
  };

  const removeJadwal = async (id: string) => {
    setLoading(true);
    const result = await jadwalFetcher.deleteJadwal(id);
    if (result.ok) {
      await fetchJadwal();
    } else {
      setLoading(false);
    }
    return result;
  };

  useEffect(() => {
    fetchMataKuliah();
  }, [fetchMataKuliah]);

  useEffect(() => {
    if (selectedTerm) {
      fetchJadwal();
    }
  }, [selectedTerm, selectedModul, fetchJadwal]);

  return {
    data,
    jadwalPengganti,
    selectedTerm,
    moduls,
    selectedModul,
    setSelectedModul,
    loading,
    error,
    refetch: fetchJadwal,
    mataKuliahList,
    addJadwal,
    editJadwal,
    upsertPengganti,
    removeJadwal,
  };
}

export function useTodaySchedule(limit: number = 5) {
  const [data, setData] = useState<Jadwal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const result = await jadwalFetcher.fetchTodaySchedule(limit);
      if (result.ok && result.data) {
        setData(result.data);
      }
      setLoading(false);
    }
    fetch();
  }, [limit]);

  return { data, loading };
}
