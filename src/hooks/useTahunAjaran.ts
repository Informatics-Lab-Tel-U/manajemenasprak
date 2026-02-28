'use client';

import { useState, useCallback, useEffect } from 'react';
import * as tahunAjaranFetcher from '@/lib/fetchers/tahunAjaranFetcher';

export function useTahunAjaran() {
  const [tahunAjaranList, setTahunAjaranList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTahunAjaran = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await tahunAjaranFetcher.fetchAvailableTahunAjaran();
      if (result.ok && result.data) {
        setTahunAjaranList(result.data);
      } else {
        setError(result.error || 'Failed to fetch academic years');
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTahunAjaran();
  }, [fetchTahunAjaran]);

  return {
    tahunAjaranList,
    loading,
    error,
    refetch: fetchTahunAjaran,
  };
}

