'use client';

import { Suspense, useState, useEffect } from 'react';
import { useAsprak } from '@/hooks/useAsprak';
import { useMataKuliah } from '@/hooks/useMataKuliah';
import { Skeleton } from '@/components/ui/skeleton';
import { usePraktikum } from '@/hooks/usePraktikum';
import { Button } from '@/components/ui/button';
import { Plus, Upload, BookOpen } from 'lucide-react';
import AsprakFilters from '@/components/asprak/AsprakFilters';
import MataKuliahList from '@/components/mata-kuliah/MataKuliahList';
import MataKuliahImportModal from '@/components/mata-kuliah/MataKuliahImportModal';
import MataKuliahManualModal from '@/components/mata-kuliah/MataKuliahManualModal';
import { toast } from 'sonner';

function MataKuliahPageContent() {
  const {
    terms,
    selectedTerm,
    setSelectedTerm,
    loading: asprakLoading,
  } = useAsprak(undefined, true);
  const { getMataKuliahByTerm, createMataKuliah, bulkImportMataKuliah, loading } = useMataKuliah();
  const { getPraktikumByTerm } = usePraktikum();

  const [groupedData, setGroupedData] = useState<any[]>([]);
  const [validPraktikums, setValidPraktikums] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!selectedTerm) {
        if (terms.length === 0 && !asprakLoading) {
          setLoadingData(false);
        }
        return;
      }

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
  }, [selectedTerm, getMataKuliahByTerm, getPraktikumByTerm, terms.length, asprakLoading]);

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
        console.error(res.errors);
      }
      // Refresh list if imported to current term
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
    // Match group name or any item name/prodi
    if (group.mk_singkat.toLowerCase().includes(q)) return true;
    return group.items.some(
      (item: any) =>
        item.nama_lengkap.toLowerCase().includes(q) || item.program_studi.toLowerCase().includes(q)
    );
  });

  if (!mounted) {
    return (
      <div className="container relative space-y-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Skeleton className="h-10 flex-1 md:flex-none md:w-32" />
            <Skeleton className="h-10 flex-1 md:flex-none md:w-32" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="space-y-8">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-7 w-48" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-[184px] rounded-xl border bg-card animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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

      {/* Filters */}
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

      {/* Content */}
      <div className="min-h-[400px]">
        <MataKuliahList groupedData={filteredData} loading={isLoading} onRefresh={() => {}} />
      </div>

      {/* Modals */}
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

export default function MataKuliahPage() {
  return (
    <Suspense>
      <MataKuliahPageContent />
    </Suspense>
  );
}
