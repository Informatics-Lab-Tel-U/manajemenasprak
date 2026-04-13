import { useState, useEffect, useCallback } from 'react';
import { fetchJadwalJaga, fetchRekapJagaAggregated } from '@/lib/fetchers/jagaFetcher';
import { JadwalJaga } from '@/types/database';

export function useJaga(term: string, modul?: number, hari?: string) {
  const [jagaList, setJagaList] = useState<JadwalJaga[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    setJagaList([]); // Reset list to prevent showing stale data from previous modules

    if (!term) {
      setLoading(false);
      return;
    }
    
    const { data } = await fetchJadwalJaga(term, modul, hari);
    setJagaList(data || []); // Ensure we set an empty array if data is missing or undefined
    setLoading(false);
  }, [term, modul, hari]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    jagaList,
    loading,
    refresh: loadData,
  };
}

export function useRekapJaga(term: string) {
  const [rekapAslab, setRekapAslab] = useState<any[]>([]);
  const [rekapAsprak, setRekapAsprak] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    setRekapAslab([]);
    setRekapAsprak([]);

    if (!term) {
      setLoading(false);
      return;
    }
    const { data } = await fetchRekapJagaAggregated(term);
    if (data) {
      // Data is an array of records {modul, id_asprak, asprak: {kode, role}}
      // Group by id_asprak -> kode, role, {modul: count}
      const map = new Map<string, any>();
      data.forEach(row => {
        const id = row.id_asprak;
        if (!map.has(id)) {
          map.set(id, {
            id,
            kode: row.asprak?.kode || '?',
            role: row.asprak?.role || 'ASPRAK',
            w: {},
            total: 0
          });
        }
        const user = map.get(id);
        const m = row.modul;
        user.w[m] = (user.w[m] || 0) + 1;
        user.total += 1;
      });

      const aggregated = Array.from(map.values())
        .sort((a, b) => a.kode.localeCompare(b.kode));

      setRekapAslab(aggregated.filter(x => x.role === 'ASLAB'));
      setRekapAsprak(aggregated.filter(x => x.role === 'ASPRAK'));
    }
    setLoading(false);
  }, [term]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    rekapAslab,
    rekapAsprak,
    loading,
    refresh: loadData
  };
}
