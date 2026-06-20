'use client';

import { useState, useEffect, useCallback } from 'react';
import { Jadwal, JadwalPengganti } from '@/types/database';
import * as jadwalFetcher from '@/lib/fetchers/jadwalFetcher';
import type { DashboardStats } from '@/services/databaseService';

export interface UseDashboardResult {
  terms: string[];
  selectedTerm: string;
  setSelectedTerm: (term: string) => void;
  stats: DashboardStats;
  rawJadwal: Jadwal[];
  jadwalPengganti: JadwalPengganti[];
  loading: boolean;
  error: Error | null;
}

export function useDashboard(
  initialTerms: string[],
  initialStats: DashboardStats,
  initialJadwal: Jadwal[],
  initialPengganti: JadwalPengganti[],
  activeModul: number
): UseDashboardResult {
  // initialTerms is already sorted descending by fetchAvailableTerms (latest first)
  const [terms] = useState<string[]>(initialTerms);
  const [rawJadwal, setRawJadwal] = useState<Jadwal[]>(initialJadwal);
  const [jadwalPengganti, setJadwalPengganti] = useState<JadwalPengganti[]>(initialPengganti);
  // Use initialTerms[0] which is guaranteed to be the latest term
  const [selectedTerm, setSelectedTerm] = useState(initialTerms[0] || '');
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track whether this is the initial mount — initial data is already
  // correctly scoped from the server, so we skip the first refetch.
  const [hasMounted, setHasMounted] = useState(false);

  const fetchDashboardData = useCallback(
    async (term: string) => {
      if (!term) return;

      setLoading(true);
      try {
        const [jadwalResult, penggantiResult, statsRes] = await Promise.all([
          jadwalFetcher.fetchJadwalByTerm(term),
          jadwalFetcher.fetchJadwalPengganti(activeModul),
          fetch(`/api/stats?term=${encodeURIComponent(term)}`),
        ]);

        if (jadwalResult.ok && jadwalResult.data) {
          setRawJadwal(jadwalResult.data);
        }

        if (penggantiResult.ok && penggantiResult.data) {
          setJadwalPengganti(penggantiResult.data);
        }

        const statsJson = await statsRes.json();
        if (statsJson?.ok && statsJson.data) {
          setStats(statsJson.data as DashboardStats);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(new Error('An unknown error occurred'));
        }
      } finally {
        setLoading(false);
      }
    },
    [activeModul]
  );

  useEffect(() => {
    if (!hasMounted) {
      // First render: SSR data is already correct for this term — skip refetch
      setHasMounted(true);
      return;
    }
    // User changed the term selector: refetch
    fetchDashboardData(selectedTerm);
  }, [selectedTerm, fetchDashboardData, hasMounted]);

  return {
    terms,
    selectedTerm,
    setSelectedTerm,
    stats,
    rawJadwal,
    jadwalPengganti,
    loading,
    error,
  };
}
