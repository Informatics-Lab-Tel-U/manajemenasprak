
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAsprak } from '@/hooks/useAsprak';
import { usePraktikum } from '@/hooks/usePraktikum';
import { fetchPlottingData, AsprakPlottingData } from '@/lib/fetchers/asprakFetcher';
import PlottingFilters from '@/components/plotting/PlottingFilters';
import PlottingTable from '@/components/plotting/PlottingTable';
import PlottingImportModal from '@/components/plotting/PlottingImportModal';
import PlottingManualModal from '@/components/plotting/PlottingManualModal';
import { Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function PlottingPage() {
  const { terms, selectedTerm, setSelectedTerm } = useAsprak(); 
  const { getPraktikumByTerm } = usePraktikum(); 

  const [data, setData] = useState<AsprakPlottingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Praktikum Filter State
  const [praktikums, setPraktikums] = useState<{id: string, nama: string}[]>([]);
  const [selectedPraktikum, setSelectedPraktikum] = useState('all');

  // Modals
  const [showImport, setShowImport] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Fetch Data
  const loadData = useCallback(async () => {
    setLoading(true);
    const term = selectedTerm === 'all' ? undefined : selectedTerm;
    const result = await fetchPlottingData(term);
    if (result.ok && result.data) {
        setData(result.data);
    } else {
        toast.error("Failed to load plotting data");
    }
    setLoading(false);
  }, [selectedTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]); // selectedTerm dependency via loadData

  // Update Praktikum List when Term Changes
  useEffect(() => {
      const termArg = selectedTerm === '' ? 'all' : selectedTerm; 
      getPraktikumByTerm(termArg).then(data => {
          setPraktikums(data || []);
      });
      setSelectedPraktikum('all'); 
  }, [selectedTerm, getPraktikumByTerm]);

  // Client-side Filtering
  const filteredData = useMemo(() => {
      let result = data;

      // Filter by Praktikum (if selected)
      if (selectedPraktikum !== 'all') {
          // Filter Aspraks who have THIS assignment
          result = result.filter(asprak => 
              asprak.assignments.some(a => a.id === selectedPraktikum)
          );
      }

      // Filter by Search
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          result = result.filter(item => 
              item.nama_lengkap.toLowerCase().includes(q) ||
              item.nim.includes(q) ||
              item.kode.toLowerCase().includes(q) ||
              item.assignments.some(a => a.nama.toLowerCase().includes(q))
          );
      }
      
      return result;
  }, [data, selectedPraktikum, searchQuery]);

  return (
    <div className="container py-6 space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight title-gradient">Plotting Asprak</h1>
            <p className="text-muted-foreground">Manage assistant course assignments</p>
          </div>
          <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowManual(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Input Manual
              </Button>
              <Button onClick={() => setShowImport(true)}>
                  <Upload className="mr-2 h-4 w-4" /> Import CSV
              </Button>
          </div>
       </div>

       <div className="card glass p-6">
           <PlottingFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                terms={terms}
                selectedTerm={selectedTerm}
                onTermChange={setSelectedTerm}
                praktikums={praktikums}
                selectedPraktikum={selectedPraktikum}
                onPraktikumChange={setSelectedPraktikum}
           />

           <div className="mt-6">
               <PlottingTable 
                   data={filteredData} 
                   loading={loading} 
                   term={selectedTerm}
               />
           </div>
       </div>
       
       <PlottingImportModal 
           open={showImport} 
           onOpenChange={setShowImport} 
           onSuccess={() => {
               loadData(); 
           }}
           terms={terms}
       />
       
       <PlottingManualModal
           open={showManual}
           onOpenChange={setShowManual} 
           onSuccess={() => {
               loadData();
           }}
           terms={terms}
       />
    </div>
  );
}
