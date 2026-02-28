'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
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
  const { terms, selectedTerm, setSelectedTerm } = useAsprak();
  const { getPraktikumByTerm, bulkImport, getOrCreate, loading: praktikumLoading } = usePraktikum();

  const [praktikumList, setPraktikumList] = useState<PraktikumWithStats[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedPraktikum, setSelectedPraktikum] = useState<PraktikumWithStats | null>(null);

  useEffect(() => {
    async function fetchPraktikums() {
      if (selectedTerm === undefined) return;

      setLoadingList(true);
      const data = await getPraktikumByTerm(selectedTerm);
      setPraktikumList(data);
      setLoadingList(false);
    }
    fetchPraktikums();
  }, [selectedTerm, getPraktikumByTerm]);

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

  return (
    <div className="container relative space-y-8">
      <header>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="title-gradient text-3xl font-bold">Data Praktikum</h1>
            <p className="text-muted-foreground mt-2">Kelola data praktikum dan penugasan per angkatan</p>
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
    <Suspense fallback={<div className="container py-10 text-center">Memuat...</div>}>
      <PraktikumPageContent />
    </Suspense>
  );
}

