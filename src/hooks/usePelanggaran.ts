'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pelanggaran, Praktikum, Asprak, Jadwal } from '@/types/database';
import * as pelanggaranFetcher from '@/lib/fetchers/pelanggaranFetcher';
import * as asprakFetcher from '@/lib/fetchers/asprakFetcher';
import { PelanggaranCountMap } from '@/services/pelanggaranService';
import { CreatePelanggaranInput } from '@/types/api';
import { toast } from 'sonner';

export function usePelanggaran(initialTahunAjaran?: string, isKoor: boolean = false, userId?: string) {
  const [praktikumList, setPraktikumList] = useState<Praktikum[]>([]);
  const [tahunAjaranList, setTahunAjaranList] = useState<string[]>([]);
  const [selectedTahun, setSelectedTahun] = useState(initialTahunAjaran || '');
  const [countMap, setCountMap] = useState<PelanggaranCountMap>({});
  const [asprakList, setAsprakList] = useState<(Asprak & { praktikum_ids?: string[] })[]>([]);
  const [jadwalList, setJadwalList] = useState<(Jadwal & { id_praktikum?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [countsRes, asprakRes, jadwalRes] = await Promise.all([
        pelanggaranFetcher.fetchPelanggaranCounts(isKoor),
        asprakFetcher.fetchPlottingData(),
        pelanggaranFetcher.fetchJadwalForPelanggaran(),
      ]);

      if (countsRes.ok) setCountMap(countsRes.data || {});
      
      if (asprakRes.ok && asprakRes.data) {
        const formattedAsprak = asprakRes.data.map((a: any) => ({
          ...a,
          praktikum_ids: a.assignments?.map((ap: any) => ap.id) || [],
        }));
        setAsprakList(formattedAsprak);
      }

      if (jadwalRes.ok) setJadwalList(jadwalRes.data as any || []);

      // If we are Koor, we need to fetch specific praktikum list
      // Otherwise it's usually passed or fetched generally (handled in page or separately)
      // For now, we assume praktikumList might be passed or we fetch it if missing
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [isKoor]);

  const fetchPraktikum = useCallback(async () => {
    if (isKoor && userId) {
      const res = await pelanggaranFetcher.fetchKoorPraktikumList(userId);
      if (res.ok && res.data) {
        setPraktikumList(res.data);
        const years = Array.from(new Set(res.data.map((p) => p.tahun_ajaran))).sort().reverse();
        setTahunAjaranList(years);
        if (years.length > 0 && !selectedTahun) {
          setSelectedTahun(years[0]);
        }
      }
    }
  }, [isKoor, userId, selectedTahun]);

  const addPelanggaran = async (input: CreatePelanggaranInput) => {
    const result = await pelanggaranFetcher.createPelanggaran(input);
    if (result.ok) {
      await fetchData(); // Refresh counts
    }
    return result;
  };

  const removePelanggaran = async (id: string) => {
    const result = await pelanggaranFetcher.deletePelanggaran(id);
    if (result.ok) {
      await fetchData();
    }
    return result;
  };

  const finalize = async (idPraktikum: string) => {
    const result = await pelanggaranFetcher.finalizePelanggaran(idPraktikum);
    if (result.ok) {
        await fetchData();
    }
    return result;
  };

  useEffect(() => {
    fetchData();
    fetchPraktikum();
  }, [fetchData, fetchPraktikum]);

  return {
    praktikumList,
    tahunAjaranList,
    selectedTahun,
    setSelectedTahun,
    countMap,
    asprakList,
    jadwalList,
    loading,
    error,
    addPelanggaran,
    removePelanggaran,
    finalize,
    refetch: fetchData,
  };
}

export function usePelanggaranDetail(idPraktikum: string, initialViolations?: Pelanggaran[], initialPraktikum?: Praktikum) {
  const [violations, setViolations] = useState<Pelanggaran[]>(initialViolations || []);
  const [praktikum, setPraktikum] = useState<Praktikum | null>(initialPraktikum || null);
  const [asprakList, setAsprakList] = useState<(Asprak & { praktikum_ids?: string[] })[]>([]);
  const [jadwalList, setJadwalList] = useState<(Jadwal & { id_praktikum?: string })[]>([]);
  const [loading, setLoading] = useState(!initialViolations || !initialPraktikum);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch violations, praktikum detail, and auxiliary data for Add Modal
      const [vResult, pResult, asprakRes, jadwalRes] = await Promise.all([
        pelanggaranFetcher.fetchPelanggaranByFilter(idPraktikum),
        pelanggaranFetcher.fetchPraktikumDetail(idPraktikum),
        asprakFetcher.fetchPlottingData(),
        pelanggaranFetcher.fetchJadwalForPelanggaran(),
      ]);

      if (vResult.ok) setViolations(vResult.data || []);
      else setError(vResult.error || 'Gagal mengambil data pelanggaran');

      if (pResult.ok) setPraktikum(pResult.data || null);
      else if (!error) setError(pResult.error || 'Gagal mengambil detail praktikum');

      if (asprakRes.ok && asprakRes.data) {
        const formattedAsprak = asprakRes.data.map((a: any) => ({
          ...a,
          praktikum_ids: a.assignments?.map((ap: any) => ap.id) || [],
        }));
        setAsprakList(formattedAsprak);
      }

      if (jadwalRes.ok) setJadwalList(jadwalRes.data as any || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }, [idPraktikum, error]);

  useEffect(() => {
    fetchDetail();
  }, [idPraktikum]); // Fetch on mount or when id changes

  const addPelanggaran = async (input: CreatePelanggaranInput) => {
    const result = await pelanggaranFetcher.createPelanggaran(input);
    if (result.ok) {
      fetchDetail();
    }
    return result;
  };

  const deletePelanggaran = async (id: string) => {
    const result = await pelanggaranFetcher.deletePelanggaran(id);
    if (result.ok) {
      toast.success('Pelanggaran berhasil dihapus');
      fetchDetail();
    } else {
      toast.error(`Gagal menghapus: ${result.error}`);
    }
    return result;
  };

  const finalize = async () => {
    const result = await pelanggaranFetcher.finalizePelanggaran(idPraktikum);
    if (result.ok) {
      toast.success('Pelanggaran praktikum berhasil difinalisasi');
      fetchDetail();
    } else {
      toast.error(`Gagal memfinalisasi: ${result.error}`);
    }
    return result;
  };

  const isFinalized = violations.length > 0 && violations.every((v) => v.is_final);

  return {
    violations,
    praktikum,
    asprakList,
    jadwalList,
    loading,
    error,
    isFinalized,
    refresh: fetchDetail,
    addPelanggaran,
    deletePelanggaran,
    finalize,
  };
}

