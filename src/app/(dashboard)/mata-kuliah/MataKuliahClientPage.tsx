'use client';

import { useState, useEffect } from 'react';
import { useAsprak } from '@/hooks/useAsprak';
import { useMataKuliah } from '@/hooks/useMataKuliah';
import { usePraktikum } from '@/hooks/usePraktikum';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import AsprakFilters from '@/components/asprak/AsprakFilters';
import MataKuliahList from '@/components/mata-kuliah/MataKuliahList';
import MataKuliahImportModal from '@/components/mata-kuliah/MataKuliahImportModal';
import MataKuliahManualModal from '@/components/mata-kuliah/MataKuliahManualModal';
import { toast } from 'sonner';

interface MataKuliahClientPageProps {
  initialGroupedData: any[]; // MataKuliahGrouped[]
  initialValidPraktikums: any[];
  initialTerms: string[];
  initialPraktikumNames: { id: string; nama: string }[];
}

export default function MataKuliahClientPage({
  initialGroupedData,
  initialValidPraktikums,
  initialTerms,
  initialPraktikumNames,
}: MataKuliahClientPageProps) {
  const {
    terms,
    selectedTerm,
    setSelectedTerm,
    loading: asprakLoading,
  } = useAsprak(initialTerms[0], true, {
    terms: initialTerms,
  });

  const { getMataKuliahByTerm, createMataKuliah, bulkImportMataKuliah, loading } = useMataKuliah();
  const { getPraktikumByTerm } = usePraktikum({
    praktikumNames: initialPraktikumNames,
  });

  const [groupedData, setGroupedData] = useState<any[]>(initialGroupedData);
  const [validPraktikums, setValidPraktikums] = useState<any[]>(initialValidPraktikums);
  const [loadingData, setLoadingData] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      // If we are at the initial term, we don't need to fetch
      if (selectedTerm === initialTerms[0]) {
        return;
      }

      if (!selectedTerm) return;

      try {
        setLoadingData(true);
        const [mkData, praktikumData] = await Promise.all([
          getMataKuliahByTerm(selectedTerm),
          getPraktikumByTerm(selectedTerm),
        ]);
        setGroupedData(mkData);
        setValidPraktikums(praktikumData);
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, [selectedTerm, initialTerms, getMataKuliahByTerm, getPraktikumByTerm]);

  const isLoading = loading || loadingData || asprakLoading;

  const handleManualAdd = async (data: any, term: string) => {
    try {
      await createMataKuliah(data, term);
      toast.success('Mata Kuliah berhasil ditambahkan');

      if (term === selectedTerm) {
        const newData = await getMataKuliahByTerm(selectedTerm);
        setGroupedData(newData);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleImport = async (rows: any[], term: string) => {
    try {
      const res = await bulkImportMataKuliah(rows, term);
      toast.success(`Import berhasil: ${res.inserted} data masuk.`);
      if (res.errors.length > 0) {
        toast.warning(`Beberapa data gagal: ${res.errors.length} kesalahan`);
      }
      if (term === selectedTerm) {
        const newData = await getMataKuliahByTerm(selectedTerm);
        setGroupedData(newData);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filteredData = (Array.isArray(groupedData) ? groupedData : []).filter((group) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (group.mk_singkat.toLowerCase().includes(q)) return true;
    return group.items.some(
      (item: any) =>
        item.nama_lengkap.toLowerCase().includes(q) || item.program_studi.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container relative space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mata Kuliah</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data mata kuliah, koordinator, dan varian prodi per tahun ajaran.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 items-center w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowManualModal(true)}
            className="flex-1 md:flex-none min-w-0 md:whitespace-nowrap"
          >
            <Plus className="flex-shrink-0 h-4 w-4" />
            <span className="hidden sm:inline ml-2">Input Manual</span>
          </Button>
          <Button
            onClick={() => setShowImportModal(true)}
            className="flex-1 md:flex-none min-w-0 md:whitespace-nowrap"
          >
            <Upload className="flex-shrink-0 h-4 w-4" />
            <span className="hidden sm:inline ml-2">Import CSV</span>
          </Button>
        </div>
      </div>

      <div className="card glass p-4">
        <AsprakFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          terms={terms}
          selectedTerm={selectedTerm}
          onTermChange={setSelectedTerm}
          hideSearch={false}
        />
      </div>

      <div className="min-h-[400px]">
        <MataKuliahList groupedData={filteredData} loading={isLoading} />
      </div>

      {showImportModal && (
        <MataKuliahImportModal
          open={showImportModal}
          onClose={() => setShowImportModal(false)}
          validPraktikums={validPraktikums}
          onImport={handleImport}
          defaultTerm={selectedTerm}
        />
      )}

      {showManualModal && (
        <MataKuliahManualModal
          open={showManualModal}
          onClose={() => setShowManualModal(false)}
          defaultTerm={selectedTerm}
          onConfirm={handleManualAdd}
        />
      )}
    </div>
  );
}
