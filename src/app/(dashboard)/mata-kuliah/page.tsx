
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useAsprak } from '@/hooks/useAsprak';
import { useMataKuliah } from '@/hooks/useMataKuliah';
import { usePraktikum } from '@/hooks/usePraktikum';
import { Button } from '@/components/ui/button';
import { Plus, Upload, BookOpen } from 'lucide-react';
import AsprakFilters from '@/components/asprak/AsprakFilters';
import MataKuliahList from '@/components/mata-kuliah/MataKuliahList';
import MataKuliahImportModal from '@/components/mata-kuliah/MataKuliahImportModal';
import MataKuliahManualModal from '@/components/mata-kuliah/MataKuliahManualModal';
import { toast } from 'sonner';

function MataKuliahPageContent() {
  const { terms, selectedTerm, setSelectedTerm } = useAsprak();
  const { getMataKuliahByTerm, createMataKuliah, bulkImportMataKuliah, loading } = useMataKuliah();
  const { getPraktikumByTerm } = usePraktikum();

  const [groupedData, setGroupedData] = useState<any[]>([]);
  const [validPraktikums, setValidPraktikums] = useState<any[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Data
  useEffect(() => {
    async function fetchData() {
        // Fetch data even if term is empty (All Terms)

        
        try {
            const [mkData, praktikumData] = await Promise.all([
                getMataKuliahByTerm(selectedTerm),
                getPraktikumByTerm(selectedTerm)
            ]);
            setGroupedData(mkData);
            setValidPraktikums(praktikumData);
        } catch (e) {
            console.error(e);
        }
    }
    fetchData();
  }, [selectedTerm, getMataKuliahByTerm, getPraktikumByTerm]);

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
              toast.warning(`Beberapa data gagal: ${res.errors.length} errors`);
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

  // Client-side filtering
  const filteredData = (Array.isArray(groupedData) ? groupedData : []).filter(group => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      // Match group name or any item name/prodi
      if (group.mk_singkat.toLowerCase().includes(q)) return true;
      return group.items.some((item: any) => 
          item.nama_lengkap.toLowerCase().includes(q) || 
          item.program_studi.toLowerCase().includes(q)
      );
  });

  return (
    <div className="container relative space-y-8">
       {/* Header */}
       <div className="flex justify-between items-center">
         <div>
           <h1 className="title-gradient text-4xl font-bold">Mata Kuliah</h1>
           <p className="text-muted-foreground mt-2">
             Kelola data mata kuliah, koordinator, dan varian prodi per tahun ajaran.
           </p>
         </div>
         <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowManualModal(true)}>
                <Plus className="mr-2 h-4 w-4" /> Input Manual
            </Button>
            <Button onClick={() => setShowImportModal(true)}>
                <Upload className="mr-2 h-4 w-4" /> Import CSV
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
           <MataKuliahList 
              groupedData={filteredData} 
              loading={loading} 
              onRefresh={() => {}} 
           />
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
        <Suspense fallback={<div>Loading...</div>}>
            <MataKuliahPageContent />
        </Suspense>
    );
}
