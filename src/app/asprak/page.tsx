'use client';

import { useState, useMemo, useEffect } from 'react';
import { Download, Plus } from 'lucide-react';
import { Asprak } from '@/types/database';
import { useAsprak } from '@/hooks/useAsprak';
import { usePraktikum } from '@/hooks/usePraktikum';
import { fetchExistingCodes, AsprakAssignment } from '@/lib/fetchers/asprakFetcher';
import { filterActiveAspraks, filterInactiveAspraks } from '@/utils/asprak';
import AsprakFilters from '@/components/asprak/AsprakFilters';
import AsprakTable from '@/components/asprak/AsprakTable';
import AsprakAddModal from '@/components/asprak/AsprakAddModal';
import AsprakDetailsModal from '@/components/asprak/AsprakDetailsModal';
import { AsprakFormData } from '@/components/asprak/AsprakForm';
import { Button } from '@/components/ui/button';

interface AsprakWithAssignments extends Asprak {
  assignments?: AsprakAssignment[];
}

export default function AsprakPage() {
  const { data: asprakList, loading, refetch: fetchAsprak, upsert, getAssignments } = useAsprak();
  const { praktikumNames: availablePraktikums } = usePraktikum();
  const [existingCodes, setExistingCodes] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'all'>('active');
  const [selectedAsprak, setSelectedAsprak] = useState<AsprakWithAssignments | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    async function fetchCodes() {
      const result = await fetchExistingCodes();
      if (result.ok && result.data) {
        setExistingCodes(result.data);
      }
    }
    fetchCodes();
  }, []);

  const handleFormSubmit = async (data: AsprakFormData) => {
    const result = await upsert(data);

    if (!result.ok) {
      throw new Error(result.error);
    }

    alert('Data saved successfully!');
    setShowAddModal(false);
    fetchAsprak();
  };

  const handleView = async (asprak: Asprak) => {
    setSelectedAsprak(asprak);
    setLoadingDetails(true);

    const assignments = await getAssignments(asprak.id);
    setSelectedAsprak({ ...asprak, assignments });
    setLoadingDetails(false);
  };

  const closeDetails = () => setSelectedAsprak(null);

  const filteredList = useMemo(() => {
    let list = asprakList;

    if (filterStatus === 'active') {
      list = filterActiveAspraks(list);
    } else if (filterStatus === 'inactive') {
      list = filterInactiveAspraks(list);
    }

    if (!searchQuery) return list;
    const lowerQ = searchQuery.toLowerCase();
    return list.filter(
      (a) =>
        a.nama_lengkap.toLowerCase().includes(lowerQ) ||
        a.nim.includes(lowerQ) ||
        a.kode.toLowerCase().includes(lowerQ)
    );
  }, [asprakList, searchQuery, filterStatus]);

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
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Input Manual
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
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
        />

        <AsprakTable data={filteredList} loading={loading} onViewDetails={handleView} />
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AsprakAddModal
          existingCodes={existingCodes}
          availablePraktikums={availablePraktikums}
          onSubmit={handleFormSubmit}
          onClose={() => setShowAddModal(false)}
          open={showAddModal}
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
