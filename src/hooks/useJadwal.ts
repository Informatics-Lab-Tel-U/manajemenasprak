'use client';

import { useState, useEffect, useCallback } from 'react';
import { Jadwal } from '@/types/database';
import * as jadwalFetcher from '@/lib/fetchers/jadwalFetcher';

export function useJadwal(initialTerm?: string) {
  const [data, setData] = useState<Jadwal[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState(initialTerm || '');
  const [selectedModul, setSelectedModul] = useState('Default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

  const fetchTerms = useCallback(async () => {
    const result = await jadwalFetcher.fetchAvailableTerms();
    if (result.ok && result.data) {
      setTerms(result.data);
      if (result.data.length > 0 && !selectedTerm) {
        setSelectedTerm(result.data[0]);
      }
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
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [selectedTerm]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  useEffect(() => {
    if (selectedTerm) fetchJadwal();
  }, [selectedTerm, fetchJadwal]);

  return {
    data,
    terms,
    selectedTerm,
    setSelectedTerm,
    moduls,
    selectedModul,
    setSelectedModul,
    loading,
    error,
    refetch: fetchJadwal,
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
