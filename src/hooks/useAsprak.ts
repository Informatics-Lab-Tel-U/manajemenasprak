'use client';

/**
 * useAsprak Hook
 * Uses fetchers for client-side API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { Asprak } from '@/types/database';
import * as asprakFetcher from '@/lib/fetchers/asprakFetcher';

export function useAsprak(initialTerm?: string, defaultToLatest: boolean = false) {
  const [data, setData] = useState<Asprak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [terms, setTerms] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState(initialTerm || (defaultToLatest ? '' : 'all'));
  const [hasInitializedLatest, setHasInitializedLatest] = useState(false);

  const fetchTerms = useCallback(async () => {
    const result = await asprakFetcher.fetchAvailableTerms();
    if (result.ok && result.data) {
      setTerms(result.data);
      if (defaultToLatest && !hasInitializedLatest && result.data.length > 0) {
        setSelectedTerm(result.data[0]);
        setHasInitializedLatest(true);
      }
    }
  }, [defaultToLatest, hasInitializedLatest]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    // If "all" or empty (waiting for latest) is selected, pass undefined or handle appropriately.
    // We shouldn't fetch asprak if we're still waiting for the latest term initialization
    if (defaultToLatest && !hasInitializedLatest) {
      setLoading(false);
      return;
    }

    const termToFetch = selectedTerm === 'all' || selectedTerm === '' ? undefined : selectedTerm;
    const result = await asprakFetcher.fetchAllAsprak(termToFetch);

    if (result.ok) {
      setData(result.data || []);
    } else {
      setError(result.error || 'Failed to fetch');
    }

    setLoading(false);
  }, [selectedTerm]);

  const upsert = async (input: asprakFetcher.UpsertAsprakInput) => {
    const result = await asprakFetcher.upsertAsprak(input);
    if (result.ok) {
      await fetchAll();
    }
    return result;
  };

  const getAssignments = async (asprakId: number | string) => {
    const result = await asprakFetcher.fetchAsprakAssignments(asprakId);
    return result.ok ? result.data || [] : [];
  };

  const deleteAsprak = async (id: number | string) => {
    const result = await asprakFetcher.deleteAsprak(id);
    if (result.ok) {
      await fetchAll();
    }
    return result;
  };

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, selectedTerm]);

  return {
    data,
    loading,
    error,
    terms,
    selectedTerm,
    setSelectedTerm,
    refetch: fetchAll,
    upsert,
    getAssignments,
    deleteAsprak,
  };
}
