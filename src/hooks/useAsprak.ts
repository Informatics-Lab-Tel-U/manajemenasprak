/* eslint-disable react-doctor/exhaustive-deps */
'use client';

/* eslint-disable react-doctor/no-chain-state-updates, react-doctor/no-cascading-set-state, react-doctor/no-effect-chain, react-doctor/rendering-hydration-no-flicker */

/**
 * useAsprak Hook
 * Uses fetchers for client-side API calls
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Asprak } from '@/types/database';
import * as asprakFetcher from '@/lib/fetchers/asprakFetcher';
import { useTermStore } from '@/store/useTermStore';

export const getAssignments = async (asprakId: number | string) => {
  const result = await asprakFetcher.fetchAsprakAssignments(asprakId);
  return result.ok ? result.data || [] : [];
};

export function useAsprak(
  initialTerm?: string,
  defaultToLatest: boolean = false,
  initialData?: {
    asprakList?: Asprak[];
    terms?: string[];
  }
) {
  const initialDataRef = useRef(initialData);
  const initialRenderRef = useRef(true);

  const [data, setData] = useState<Asprak[]>(initialData?.asprakList || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { activeTerm, setActiveTerm } = useTermStore();
  const selectedTerm = activeTerm || '';

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    // activeTerm handles the global state. Wait until activeTerm is initialized (not empty)
    if (!selectedTerm) {
      setLoading(false);
      return;
    }

    const termToFetch = selectedTerm === 'all' ? undefined : selectedTerm;
    const result = await asprakFetcher.fetchAllAsprak(termToFetch);

    if (result.ok) {
      setData(result.data || []);
    } else {
      setError(result.error || 'Failed to fetch');
    }

    setLoading(false);
  }, [activeTerm]);

  const upsert = async (input: asprakFetcher.UpsertAsprakInput) => {
    const result = await asprakFetcher.upsertAsprak(input);
    if (result.ok) {
      await fetchAll();
    }
    return result;
  };



  const deleteAsprak = async (id: number | string) => {
    const result = await asprakFetcher.deleteAsprak(id);
    if (result.ok) {
      await fetchAll();
    }
    return result;
  };


  // eslint-disable-next-line react-doctor/no-chain-state-updates
  useEffect(() => {
    // On the first render, if we have initial data matching the selected term, skip fetching
    const effectiveInitialTerm = initialTerm || initialDataRef.current?.terms?.[0] || 'all';

    if (initialRenderRef.current) {
      initialRenderRef.current = false;
      if (initialDataRef.current?.asprakList && selectedTerm === effectiveInitialTerm) {
        setLoading(false);
        return;
      }
    }

    fetchAll();
  }, [fetchAll, activeTerm, initialTerm]);

  return {
    data,
    loading,
    error,
    refetch: fetchAll,
    upsert,
    deleteAsprak,
    getAssignments,
  };
}
