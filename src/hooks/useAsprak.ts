'use client';

/**
 * useAsprak Hook
 * Uses fetchers for client-side API calls
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Asprak } from '@/types/database';
import * as asprakFetcher from '@/lib/fetchers/asprakFetcher';

export function useAsprak(
  initialTerm?: string,
  defaultToLatest: boolean = false,
  initialData?: {
    asprakList?: Asprak[];
    terms?: string[];
  }
) {
  const [data, setData] = useState<Asprak[]>(initialData?.asprakList || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [terms, setTerms] = useState<string[]>(initialData?.terms || []);
  let _initialTermValue = initialTerm;
  if (!_initialTermValue && initialData?.terms?.[0]) {
    _initialTermValue = initialData.terms[0];
  } else if (!_initialTermValue && defaultToLatest) {
    _initialTermValue = '';
  } else if (!_initialTermValue) {
    _initialTermValue = 'all';
  }
  const [selectedTerm, setSelectedTerm] = useState(_initialTermValue);
  const [hasInitializedLatest, setHasInitializedLatest] = useState(!!initialData?.terms);
  // Use ref so fetchTerms doesn't re-create every time hasInitializedLatest changes
  const hasInitializedLatestRef = useRef(hasInitializedLatest);
  useEffect(() => {
    hasInitializedLatestRef.current = hasInitializedLatest;
  }, [hasInitializedLatest]);

  const fetchTerms = useCallback(async () => {
    if (terms.length > 0) return; // Skip if already have terms
    const result = await asprakFetcher.fetchAvailableTerms();
    if (result.ok && result.data) {
      setTerms(result.data);
      if (defaultToLatest && !hasInitializedLatestRef.current && result.data.length > 0) {
        setSelectedTerm(result.data[0]);
        setHasInitializedLatest(true);
      }
    }
  }, [defaultToLatest, terms.length]);

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
  }, [selectedTerm, defaultToLatest, hasInitializedLatest]);

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
    // If we have initial data and the term hasn't changed from initial, skip the fetch
    const effectiveInitialTerm = initialTerm || initialData?.terms?.[0] || 'all';
    if (initialData?.asprakList && selectedTerm === effectiveInitialTerm) {
      setLoading(false);
      return;
    }
    fetchAll();
  }, [fetchAll, selectedTerm, initialData, initialTerm]);

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
