'use client';

import { useState, useMemo, useEffect } from 'react';
import { Download, Plus, Upload } from 'lucide-react';
import { Asprak } from '@/types/database';
import { useAsprak } from '@/hooks/useAsprak';
import { usePraktikum } from '@/hooks/usePraktikum';
import {
  fetchExistingCodes,
  fetchAllAsprak,
  AsprakAssignment,
  bulkImportAspraks,
} from '@/lib/fetchers/asprakFetcher';
import { ExistingAsprakInfo } from '@/components/asprak/AsprakImportCSVModal';
import AsprakFilters from '@/components/asprak/AsprakFilters';
import AsprakTable from '@/components/asprak/AsprakTable';
import AsprakAddModal from '@/components/asprak/AsprakAddModal';
import AsprakImportCSVModal from '@/components/asprak/AsprakImportCSVModal';
import AsprakDetailsModal from '@/components/asprak/AsprakDetailsModal';
import { AsprakFormData } from '@/components/asprak/AsprakForm';
import { Button } from '@/components/ui/button';

interface AsprakWithAssignments extends Asprak {
  assignments?: AsprakAssignment[];
}

export default function AsprakPage() {
  const {
    data: asprakList,
    loading,
    refetch: fetchAsprak,
    upsert,
    getAssignments,
    terms,
    selectedTerm,
    setSelectedTerm,
  } = useAsprak();
  const { praktikumNames: availablePraktikums } = usePraktikum();
  const [existingCodes, setExistingCodes] = useState<string[]>([]);
  const [allExistingNims, setAllExistingNims] = useState<string[]>([]);
  const [allExistingAspraks, setAllExistingAspraks] = useState<ExistingAsprakInfo[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsprak, setSelectedAsprak] = useState<AsprakWithAssignments | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Fetch existing codes + all NIMs for conflict detection and code generation
  const refreshCodesAndNims = async () => {
    const [codesResult, allAsprakResult] = await Promise.all([
      fetchExistingCodes(),
      fetchAllAsprak(),      // No term filter — gets ALL aspraks
    ]);
    if (codesResult.ok && codesResult.data) {
      setExistingCodes(codesResult.data);
    }
    if (allAsprakResult.ok && allAsprakResult.data) {
      setAllExistingNims(allAsprakResult.data.map((a) => a.nim));
      setAllExistingAspraks(
        allAsprakResult.data.map((a) => ({ kode: a.kode, angkatan: a.angkatan }))
      );
    }
  };

  useEffect(() => {
    refreshCodesAndNims();
  }, []);

  // ─── Manual Add ─────────────────────────────────────────────────────────

  const handleFormSubmit = async (data: AsprakFormData) => {
    const result = await upsert(data);

    if (!result.ok) {
      throw new Error(result.error);
    }

    alert('Data saved successfully!');
    setShowAddModal(false);
    fetchAsprak();
    refreshCodesAndNims();
  };

  // ─── CSV Import ──────────────────────────────────────────────────────────

  const handleCSVImport = async (
    rows: { nim: string; nama_lengkap: string; kode: string; angkatan: number }[],
    _term: string
  ) => {
    const result = await bulkImportAspraks(rows);

    if (!result.ok) {
      throw new Error(result.error || 'Gagal import data.');
    }

    const data = result.data!;
    const message = `Import selesai!\n\n✅ Inserted: ${data.inserted}\n🔄 Updated: ${data.updated}${data.skipped > 0 ? `\n⚠️ Skipped: ${data.skipped}` : ''}${data.errors.length > 0 ? `\n\nErrors:\n${data.errors.join('\n')}` : ''}`;

    alert(message);
    setShowImportModal(false);
    fetchAsprak();
    refreshCodesAndNims();
  };

  // ─── View Details ────────────────────────────────────────────────────────

  const handleView = async (asprak: Asprak) => {
    setSelectedAsprak(asprak);
    setLoadingDetails(true);

    const assignments = await getAssignments(asprak.id);
    setSelectedAsprak({ ...asprak, assignments });
    setLoadingDetails(false);
  };

  const closeDetails = () => setSelectedAsprak(null);

  // ─── Filter ──────────────────────────────────────────────────────────────

  const filteredList = useMemo(() => {
    const list = asprakList;

    if (!searchQuery) return list;
    const lowerQ = searchQuery.toLowerCase();
    return list.filter(
      (a) =>
        a.nama_lengkap.toLowerCase().includes(lowerQ) ||
        a.nim.includes(lowerQ) ||
        a.kode.toLowerCase().includes(lowerQ)
    );
  }, [asprakList, searchQuery]);

  return (
    <div className="container" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="title-gradient" style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            Data Asisten Praktikum
          </h1>
          <p className="text-muted-foreground">Manage assistant pool</p>
        </div>
        <div className="flex gap-3 items-center">
          <Button variant="outline" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Input Manual
          </Button>
          <Button onClick={() => setShowImportModal(true)}>
            <Upload size={18} />
            Import CSV
          </Button>
          <Button variant="outline" onClick={() => alert('Export feature pending...')}>
            <Download size={18} />
            Export Data
          </Button>
        </div>
      </div>

      {/* Filters and Table */}
      <div className="card glass" style={{ marginBottom: '2rem' }}>
        <AsprakFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          terms={terms}
          selectedTerm={selectedTerm}
          onTermChange={setSelectedTerm}
        />

        <AsprakTable data={filteredList} loading={loading} onViewDetails={handleView} />
      </div>

      {/* Manual Add Modal */}
      {showAddModal && (
        <AsprakAddModal
          existingCodes={existingCodes}
          availablePraktikums={availablePraktikums}
          onSubmit={handleFormSubmit}
          onClose={() => setShowAddModal(false)}
          open={showAddModal}
        />
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <AsprakImportCSVModal
          existingCodes={existingCodes}
          existingNims={allExistingNims}
          existingAspraks={allExistingAspraks}
          onImport={handleCSVImport}
          onClose={() => setShowImportModal(false)}
          open={showImportModal}
        />
      )}

      {/* Details Modal */}
      {selectedAsprak && (
        <AsprakDetailsModal
          asprak={selectedAsprak}
          loading={loadingDetails}
          onClose={closeDetails}
          open={!!selectedAsprak}
        />
      )}
    </div>
  );
}
