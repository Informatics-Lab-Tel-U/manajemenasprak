'use client';

import { useState, useEffect, useCallback } from 'react';
import { Jadwal, MataKuliah } from '@/types/database';
import * as jadwalFetcher from '@/lib/fetchers/jadwalFetcher';
import * as praktikumFetcher from '@/lib/fetchers/praktikumFetcher';
import type { CreateJadwalInput, UpdateJadwalInput } from '@/services/jadwalService';

export function useJadwal(
  initialTerm?: string,
  initialData?: {
    jadwal?: Jadwal[];
    terms?: string[];
    mataKuliah?: MataKuliah[];
  }
) {
  const [data, setData] = useState<Jadwal[]>(initialData?.jadwal || []);
  const [terms, setTerms] = useState<string[]>(initialData?.terms || []);
  const [selectedTerm, setSelectedTerm] = useState(
    initialTerm || (initialData?.terms?.[0] ? initialData.terms[0] : '')
  );
  const [selectedModul, setSelectedModul] = useState('Default');
  const [loading, setLoading] = useState(!initialData?.jadwal);
  const [error, setError] = useState<Error | null>(null);
  const [mataKuliahList, setMataKuliahList] = useState<MataKuliah[]>(initialData?.mataKuliah || []);
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
    'Modul 15',
  ];

  const fetchTerms = useCallback(async () => {
    if (terms.length > 0) return;
    const result = await jadwalFetcher.fetchAvailableTerms();
    if (result.ok && result.data) {
      setTerms(result.data);
      if (result.data.length > 0 && !selectedTerm) {
        setSelectedTerm(result.data[0]);
      }
    }
  }, [selectedTerm, terms.length]);

  const fetchMataKuliah = useCallback(async () => {
    if (mataKuliahList.length > 0) return;
    const result = await praktikumFetcher.fetchMataKuliah();
    if (result.ok && result.data) {
      setMataKuliahList(result.data);
    }
  }, [mataKuliahList.length]);

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
    fetchTerms();
    fetchMataKuliah();
  }, [fetchTerms, fetchMataKuliah]);

  useEffect(() => {
    if (selectedTerm) {
      // Skip if we have initial data and haven't changed the term
      const effectiveInitialTerm = initialTerm || initialData?.terms?.[0] || '';
      if (initialData?.jadwal && selectedTerm === effectiveInitialTerm) {
        setLoading(false);
        return;
      }
      fetchJadwal();
    }
  }, [selectedTerm, fetchJadwal, initialData?.jadwal, initialTerm]);

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
