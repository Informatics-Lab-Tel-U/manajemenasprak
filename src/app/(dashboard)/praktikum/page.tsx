'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Plus, Upload, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

import { usePraktikum } from '@/hooks/usePraktikum';
import { useAsprak } from '@/hooks/useAsprak';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AsprakFilters from '@/components/asprak/AsprakFilters';
import PraktikumList from '@/components/praktikum/PraktikumList';
import PraktikumImportModal from '@/components/praktikum/PraktikumImportModal';
import PraktikumManualModal from '@/components/praktikum/PraktikumManualModal';
import PraktikumDetailsModal from '@/components/praktikum/PraktikumDetailsModal';
import { PraktikumWithStats } from '@/services/praktikumService';

function PraktikumPageContent() {
  const {
    terms,
    selectedTerm,
    setSelectedTerm,
    loading: asprakLoading,
  } = useAsprak(undefined, true);
  const { getPraktikumByTerm, bulkImport, getOrCreate, loading: praktikumLoading } = usePraktikum();

  const [praktikumList, setPraktikumList] = useState<PraktikumWithStats[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedPraktikum, setSelectedPraktikum] = useState<PraktikumWithStats | null>(null);

  useEffect(() => {
    async function fetchPraktikums() {
      if (!selectedTerm) {
        if (terms.length === 0 && !asprakLoading) {
          setLoadingList(false);
        }
        return;
      }

      setLoadingList(true);
      try {
        const data = await getPraktikumByTerm(selectedTerm);
        setPraktikumList(data);
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoadingList(false);
      }
    }
    fetchPraktikums();
  }, [selectedTerm, getPraktikumByTerm, terms.length, asprakLoading]);

  const filteredList = useMemo(() => {
    if (!searchQuery) return praktikumList;
    const lowerQ = searchQuery.toLowerCase();
    return praktikumList.filter((p) => p.nama.toLowerCase().includes(lowerQ));
  }, [praktikumList, searchQuery]);

  const handleImport = async (rows: { nama: string; tahun_ajaran: string }[]) => {
    const result = await bulkImport(rows);
    if (result.ok && result.data) {
      const { inserted, skipped, errors } = result.data;
      toast.success(`Import selesai! Berhasil: ${inserted}, Dilewati: ${skipped}`);
      if (errors.length > 0) {
        toast.error(`Terjadi kesalahan: ${errors.length} galat. Cek konsol.`);
        console.error(errors);
      }
      setShowImportModal(false);
      refreshList();
    } else {
      toast.error(`Import gagal: ${result.error}`);
    }
  };

  const handleManualAdd = async (nama: string, tahunAjaran: string) => {
    try {
      const result = await getOrCreate(nama, tahunAjaran);
      if (result) {
        toast.success(`Berhasil menambahkan praktikum ${nama}`);
        setShowManualModal(false);
        refreshList();
      } else {
        toast.error('Gagal menambahkan praktikum.');
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
  };

  const refreshList = async () => {
    if (selectedTerm) {
      const data = await getPraktikumByTerm(selectedTerm);
      setPraktikumList(data);
    }
  };

  const checkExists = async (nama: string, tahunAjaran: string) => {
    const data = await getPraktikumByTerm(tahunAjaran);
    return data.some((p) => p.nama === nama);
  };

  if (!mounted) {
    return (
      <div className="container relative space-y-8 py-8">
        <header>
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </header>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[152px] rounded-xl border bg-card animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container relative space-y-8">
      <header>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="title-gradient text-3xl font-bold">Data Praktikum</h1>
            <p className="text-muted-foreground mt-2">
              Kelola data praktikum dan penugasan per angkatan
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Button onClick={() => setShowManualModal(true)} variant="outline">
              <Plus size={18} className="mr-2" />
              Input Manual
            </Button>
            <Button onClick={() => setShowImportModal(true)}>
              <Upload size={18} className="mr-2" />
              Import CSV
            </Button>
          </div>
        </div>
      </header>

      <div className="mb-8">
        <AsprakFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          terms={terms}
          selectedTerm={selectedTerm}
          onTermChange={setSelectedTerm}
          hideSearch={true}
          hideAllOption={true}
        />

        <div className="mt-6">
          <PraktikumList
            praktikums={filteredList}
            loading={loadingList}
            onSelect={(p) => setSelectedPraktikum(p)}
          />
        </div>
      </div>

      {showImportModal && (
        <PraktikumImportModal
          open={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
          existingPraktikums={praktikumList}
        />
      )}

      {showManualModal && (
        <PraktikumManualModal
          open={showManualModal}
          onClose={() => setShowManualModal(false)}
          onConfirm={handleManualAdd}
          onCheckExists={checkExists}
        />
      )}

      {selectedPraktikum && (
        <PraktikumDetailsModal
          praktikum={selectedPraktikum}
          open={!!selectedPraktikum}
          onClose={() => setSelectedPraktikum(null)}
        />
      )}
    </div>
  );
}

export default function PraktikumPage() {
  return (
    <Suspense>
      <PraktikumPageContent />
    </Suspense>
  );
}
