'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Jadwal } from '@/types/database';
import * as jadwalFetcher from '@/lib/fetchers/jadwalFetcher';
import type { DashboardStats } from '@/services/databaseService';

export interface UseDashboardResult {
  terms: string[];
  selectedTerm: string;
  setSelectedTerm: (term: string) => void;
  stats: DashboardStats;
  todaySchedule: Jadwal[];
  loading: boolean;
  error: Error | null;
}

export function useDashboard(
  initialTerms: string[],
  initialStats: DashboardStats,
  initialSchedule: Jadwal[]
): UseDashboardResult {
  const [terms, setTerms] = useState<string[]>(initialTerms);
  const [todaySchedule, setTodaySchedule] = useState<Jadwal[]>(initialSchedule);
  const [selectedTerm, setSelectedTerm] = useState(initialTerms[0] || '2425-1');
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!selectedTerm) return;

    setLoading(true);
    try {
      const [scheduleResult, statsRes] = await Promise.all([
        jadwalFetcher.fetchTodaySchedule(100, selectedTerm),
        fetch(`/api/stats?term=${encodeURIComponent(selectedTerm)}`),
      ]);

      if (scheduleResult.ok && scheduleResult.data) {
        setTodaySchedule(scheduleResult.data);
      }

      try {
        const statsJson = await statsRes.json();
        if (statsJson?.ok && statsJson.data) {
          setStats(statsJson.data as DashboardStats);
        }
      } catch (e: any) {
        // ignore parse errors; stats remain unchanged
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
  }, [selectedTerm]);

  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    terms,
    selectedTerm,
    setSelectedTerm,
    stats,
    todaySchedule,
    loading,
    error,
  };
}
