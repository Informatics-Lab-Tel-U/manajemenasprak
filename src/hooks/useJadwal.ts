'use client';

import { useState, useEffect, useCallback } from 'react';
import { Jadwal, MataKuliah } from '@/types/database';
import * as jadwalFetcher from '@/lib/fetchers/jadwalFetcher';
import * as praktikumFetcher from '@/lib/fetchers/praktikumFetcher';
import type { CreateJadwalInput, UpdateJadwalInput } from '@/services/jadwalService';

export function useJadwal(initialTerm?: string) {
  const [data, setData] = useState<Jadwal[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState(initialTerm || '');
  const [selectedModul, setSelectedModul] = useState('Default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>([]);
  const [jadwalPengganti, setJadwalPengganti] = useState<any[]>([]);

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
  ];

  const fetchTerms = useCallback(async () => {
    const result = await jadwalFetcher.fetchAvailableTerms();
    if (result.ok && result.data) {
      setTerms(result.data);
      if (result.data.length > 0 && !selectedTerm) {
        setSelectedTerm(result.data[0]);
      }
    }
  }, [selectedTerm]);

  const fetchMataKuliah = useCallback(async () => {
    const result = await praktikumFetcher.fetchMataKuliah();
    if (result.ok && result.data) {
      setMataKuliahList(result.data);
    }
  }, []);

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

      // Fetch Jadwal Pengganti if a module is selected
      if (selectedModul !== 'Default') {
        const modulNum = parseInt(selectedModul.replace('Modul ', ''));
        const penggantiResult = await jadwalFetcher.fetchJadwalPengganti(modulNum);
        if (penggantiResult.ok && penggantiResult.data) {
          setJadwalPengganti(penggantiResult.data);
        }
      } else {
        setJadwalPengganti([]);
      }
    } catch (e) {
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

  const removeJadwal = async (id: number) => {
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
    fetchTerms();
    fetchMataKuliah();
  }, [fetchTerms, fetchMataKuliah]);

  useEffect(() => {
    if (selectedTerm) fetchJadwal();
  }, [selectedTerm, fetchJadwal]);

  return {
    data,
    jadwalPengganti,
    terms,
    selectedTerm,
    setSelectedTerm,
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
