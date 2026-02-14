'use client';

/**
 * useAsprak Hook
 * Uses fetchers for client-side API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { Asprak } from '@/types/database';
import * as asprakFetcher from '@/lib/fetchers/asprakFetcher';

export function useAsprak(initialTerm?: string) {
  const [data, setData] = useState<Asprak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [terms, setTerms] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState(initialTerm || '');

  const fetchTerms = useCallback(async () => {
    const result = await asprakFetcher.fetchAvailableTerms();
    if (result.ok && result.data) {
      setTerms(result.data);
      // Auto-select first term if none selected and not explicitly fetching all (empty string)
      // Actually, if we want "All" to be an option, we might want to keep it empty.
      // But user typically wants to see latest term.
      if (result.data.length > 0 && !selectedTerm && initialTerm === undefined) {
          // If no initial term provided, default to latest
          setSelectedTerm(result.data[0]);
      }
    }
  }, [selectedTerm, initialTerm]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    // If "all" is selected, pass undefined to fetch all
    const termToFetch = selectedTerm === 'all' ? undefined : selectedTerm;
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
      await fetchAll(); // Refresh list
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
    // Only fetch if selectedTerm is set OR if we are okay with empty term (fetching all)
    // Here we fetch whenever selectedTerm changes.
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
