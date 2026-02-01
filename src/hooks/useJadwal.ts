'use client';

import { useState, useEffect, useCallback } from 'react';
import { Jadwal } from '@/types/database';
import * as jadwalFetcher from '@/lib/fetchers/jadwalFetcher';

export function useJadwal(initialTerm?: string) {
  const [data, setData] = useState<Jadwal[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState(initialTerm || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
