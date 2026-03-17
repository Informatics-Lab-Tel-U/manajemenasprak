'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pelanggaran, Praktikum, Asprak, Jadwal } from '@/types/database';
import * as pelanggaranFetcher from '@/lib/fetchers/pelanggaranFetcher';
import * as asprakFetcher from '@/lib/fetchers/asprakFetcher';
import { PelanggaranCountMap } from '@/services/pelanggaranService';
import { CreatePelanggaranInput } from '@/types/api';
import { toast } from 'sonner';

export function usePelanggaran(
  initialTahunAjaran?: string,
  isKoor: boolean = false,
  userId?: string,
  initialData?: {
    praktikumList?: Praktikum[];
    tahunAjaranList?: string[];
    countMap?: PelanggaranCountMap;
  },
  options: { fetchHeavyData?: boolean } = { fetchHeavyData: false }
) {
  const [praktikumList, setPraktikumList] = useState<Praktikum[]>(initialData?.praktikumList || []);
  const [tahunAjaranList, setTahunAjaranList] = useState<string[]>(
    initialData?.tahunAjaranList || []
  );
  const [selectedTahun, setSelectedTahun] = useState(initialTahunAjaran || '');
  const [countMap, setCountMap] = useState<PelanggaranCountMap>(initialData?.countMap || {});
  const [asprakList, setAsprakList] = useState<(Asprak & { praktikum_ids?: string[] })[]>([]);
  const [jadwalList, setJadwalList] = useState<(Jadwal & { id_praktikum?: string })[]>([]);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<Error | null>(null);

  // Sync year list if we have initial praktikum data and no initial year list
  useEffect(() => {
    if (praktikumList.length > 0 && tahunAjaranList.length === 0) {
      const years = Array.from(new Set(praktikumList.map((p) => p.tahun_ajaran)))
        .sort()
        .reverse();
      setTahunAjaranList(years);
      if (years.length > 0 && !selectedTahun) {
        setSelectedTahun(years[0]);
      }
    }
  }, [praktikumList, selectedTahun, tahunAjaranList.length]);

  const fetchData = useCallback(async () => {
    // Only set loading if we don't already have some data
    if (Object.keys(countMap).length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      // Conditionally fetch heavy data (asprak, jadwal)
      const fetchGroup: Promise<any>[] = [pelanggaranFetcher.fetchPelanggaranCounts(isKoor)];

      if (options.fetchHeavyData) {
        fetchGroup.push(asprakFetcher.fetchPlottingData());
        fetchGroup.push(pelanggaranFetcher.fetchJadwalForPelanggaran());
      }

      const results = await Promise.all(fetchGroup);
      const countsRes = results[0];

      if (countsRes.ok) setCountMap(countsRes.data || {});

      if (options.fetchHeavyData) {
        const asprakRes = results[1];
        const jadwalRes = results[2];

        if (asprakRes.ok && asprakRes.data) {
          const formattedAsprak = asprakRes.data.map((a: any) => ({
            ...a,
            praktikum_ids: a.assignments?.map((ap: any) => ap.id) || [],
          }));
          setAsprakList(formattedAsprak);
        }

        if (jadwalRes.ok) setJadwalList((jadwalRes.data as any) || []);
      }
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [isKoor, countMap, options.fetchHeavyData]);

  const fetchPraktikum = useCallback(async () => {
    if (isKoor && userId) {
      const res = await pelanggaranFetcher.fetchKoorPraktikumList(userId);
      if (res.ok && res.data) {
        setPraktikumList(res.data);
        const years = Array.from(new Set(res.data.map((p) => p.tahun_ajaran)))
          .sort()
          .reverse();
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
    // If we have initial data, we can skip the first fetch
    // But we might still want to fetch asprak/jadwal in the background if they are needed elsewhere
    // However, on the list page they are not used.
    // To keep it simple and performant: if we have initial counts, we skip initial fetchData.
    if (!initialData) {
      fetchData();
      fetchPraktikum();
    }
  }, [fetchData, fetchPraktikum, initialData]);

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

export function usePelanggaranDetail(
  idPraktikum: string,
  initialViolations?: Pelanggaran[],
  initialPraktikum?: Praktikum
) {
  const [violations, setViolations] = useState<Pelanggaran[]>(initialViolations || []);
  const [praktikum, setPraktikum] = useState<Praktikum | null>(initialPraktikum || null);
  const [asprakList, setAsprakList] = useState<(Asprak & { praktikum_ids?: string[] })[]>([]);
  const [jadwalList, setJadwalList] = useState<(Jadwal & { id_praktikum?: string })[]>([]);
  const [loading, setLoading] = useState(!initialViolations || !initialPraktikum);
  const [error, setError] = useState<string | null>(null);

  const [selectedModul, setSelectedModul] = useState<string>('1');
  const [finalizedModules, setFinalizedModules] = useState<number[]>([]);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vResult, pResult, asprakRes, jadwalRes, fResult] = await Promise.all([
        pelanggaranFetcher.fetchPelanggaranByFilter(idPraktikum),
        pelanggaranFetcher.fetchPraktikumDetail(idPraktikum),
        asprakFetcher.fetchPlottingData(),
        pelanggaranFetcher.fetchJadwalForPelanggaran(),
        pelanggaranFetcher.fetchFinalizedModules(idPraktikum),
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

      if (jadwalRes.ok) setJadwalList((jadwalRes.data as any) || []);

      if (fResult.ok) setFinalizedModules(fResult.data || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }, [idPraktikum, error]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

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

  const unfinalize = async () => {
    const result = await pelanggaranFetcher.unfinalizePelanggaran(idPraktikum);
    if (result.ok) {
      toast.success('Finalisasi berhasil direset');
      fetchDetail();
    } else {
      toast.error(`Gagal mereset: ${result.error}`);
    }
    return result;
  };

  const finalizeModul = async (modul: number) => {
    const result = await pelanggaranFetcher.finalizePelanggaranByModul(idPraktikum, modul);
    if (result.ok) {
      toast.success(`Modul ${modul} berhasil difinalisasi`);
      fetchDetail();
    } else {
      toast.error(`Gagal memfinalisasi Modul ${modul}: ${result.error}`);
    }
    return result;
  };

  const unfinalizeModul = async (modul: number) => {
    const result = await pelanggaranFetcher.unfinalizePelanggaranByModul(idPraktikum, modul);
    if (result.ok) {
      toast.success(`Finalisasi Modul ${modul} berhasil direset`);
      fetchDetail();
    } else {
      toast.error(`Gagal mereset finalisasi Modul ${modul}: ${result.error}`);
    }
    return result;
  };

  const isFinalized = finalizedModules.includes(Number(selectedModul));

  return {
    violations,
    praktikum,
    asprakList,
    jadwalList,
    loading,
    error,
    isFinalized,
    selectedModul,
    setSelectedModul,
    finalizedModules,
    refresh: fetchDetail,
    addPelanggaran,
    deletePelanggaran,
    finalize,
    unfinalize,
    finalizeModul,
    unfinalizeModul,
  };
}
