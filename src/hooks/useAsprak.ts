'use client';

/**
 * useAsprak Hook
 * Uses fetchers for client-side API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { Asprak } from '@/types/database';
import * as asprakFetcher from '@/lib/fetchers/asprakFetcher';

export function useAsprak() {
  const [data, setData] = useState<Asprak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await asprakFetcher.fetchAllAsprak();

    if (result.ok) {
      setData(result.data || []);
    } else {
      setError(result.error || 'Failed to fetch');
    }

    setLoading(false);
  }, []);

  const upsert = async (input: asprakFetcher.UpsertAsprakInput) => {
    const result = await asprakFetcher.upsertAsprak(input);
    if (result.ok) {
      await fetchAll(); // Refresh list
    }
    return result;
  };

  const getAssignments = async (asprakId: number | string) => {
    const result = await asprakFetcher.fetchAsprakAssignments(asprakId);
    return result.ok ? result.data || [] : [];
  };

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    data,
    loading,
    error,
    refetch: fetchAll,
    upsert,
    getAssignments,
  };
}
