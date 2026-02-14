'use client';

import { useState, useEffect, useCallback } from 'react';
import * as praktikumFetcher from '@/lib/fetchers/praktikumFetcher';
import { Praktikum } from '@/types/database';

export function usePraktikum() {
  const [praktikumNames, setPraktikumNames] = useState<{ id: string; nama: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPraktikumNames = useCallback(async () => {
    setLoading(true);
    const result = await praktikumFetcher.fetchUniquePraktikumNames();
    if (result.ok && result.data) {
      setPraktikumNames(result.data);
    }
    setLoading(false);
  }, []);

  const getOrCreate = async (nama: string, tahunAjaran: string): Promise<Praktikum | null> => {
    const result = await praktikumFetcher.fetchOrCreatePraktikum(nama, tahunAjaran);
    return result.ok && result.data ? result.data : null;
  };

  const getPraktikumByTerm = async (term: string): Promise<Praktikum[]> => {
    const result = await praktikumFetcher.fetchPraktikumByTerm(term);
    return result.ok && result.data ? result.data : [];
  };

  useEffect(() => {
    fetchPraktikumNames();
  }, [fetchPraktikumNames]);

  return {
    praktikumNames,
    loading,
    refetch: fetchPraktikumNames,
    getOrCreate,
    getPraktikumByTerm,
  };
}
