'use client';

import { useState, useEffect, useCallback } from 'react';
import { Jadwal } from '@/types/database';
import * as jadwalFetcher from '@/lib/fetchers/jadwalFetcher';
import { getTodaySchedule } from '@/services';

export function useDashboard(initialTerm?: string) {
  const [terms, setTerms] = useState<string[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<Jadwal[]>([]);
  const [selectedTerm, setSelectedTerm] = useState(initialTerm || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTerms = useCallback(async () => {
    const result = await jadwalFetcher.fetchAvailableTerms();
    if (result.ok && result.data) {
      setTerms(result.data);
      if (result.data.length > 0 && !selectedTerm) {
        setSelectedTerm(result.data[0]);
      }
    }
  }, [selectedTerm]);

  const fetchTodaySchedule = useCallback(async () => {
    const result = await jadwalFetcher.fetchTodaySchedule(5);
    if (!result) {
      setError(new Error('Failed to fetch today schedule'));
    }
    if (result.ok && result.data) {
      setTodaySchedule(result.data);
    }
  }, [selectedTerm]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  useEffect(() => {
    fetchTodaySchedule();
  }, [fetchTodaySchedule]);

  return {
    terms,
    selectedTerm,
    setSelectedTerm,
    todaySchedule,
    loading,
    error,
  };
}
