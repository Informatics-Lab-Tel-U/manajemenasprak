'use client';

import { useState, useCallback, useEffect } from 'react';
import * as praktikumFetcher from '@/lib/fetchers/praktikumFetcher';
import { Praktikum } from '@/types/database';
import { PraktikumWithStats } from '@/services/praktikumService';

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

  const getOrCreate = useCallback(async (nama: string, tahunAjaran: string): Promise<Praktikum | null> => {
    const result = await praktikumFetcher.fetchOrCreatePraktikum(nama, tahunAjaran);
    return result.ok && result.data ? result.data : null;
  }, []);

  const getPraktikumByTerm = useCallback(async (term: string): Promise<PraktikumWithStats[]> => {
    const result = await praktikumFetcher.fetchPraktikumByTerm(term);
    return result.ok && result.data ? result.data : [];
  }, []);

  const bulkImport = useCallback(async (rows: { nama: string; tahun_ajaran: string }[]) => {
    return await praktikumFetcher.bulkImportPraktikum(rows);
  }, []);

  useEffect(() => {
    fetchPraktikumNames();
  }, [fetchPraktikumNames]);

  return {
    praktikumNames,
    loading,
    refetch: fetchPraktikumNames,
    getOrCreate,
    getPraktikumByTerm,
    bulkImport,
  };
}
