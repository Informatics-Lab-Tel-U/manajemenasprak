'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, Plus, Upload, Pencil, ChevronDown, Users, GitFork, X } from 'lucide-react';
import { toast } from 'sonner';
import { Asprak } from '@/types/database';
import { useAsprak } from '@/hooks/useAsprak';
import { usePraktikum } from '@/hooks/usePraktikum';
import {
  fetchExistingCodes,
  fetchAllAsprak,
  AsprakAssignment,
  bulkImportAspraks,
  updateAssignments,
  UpsertAsprakInput,
} from '@/lib/fetchers/asprakFetcher';
import { ExistingAsprakInfo } from '@/components/asprak/AsprakImportCSVModal';
import { ExistingNimInfo } from '@/utils/validation/asprakValidation';
import AsprakFilters from '@/components/asprak/AsprakFilters';
import AsprakTable from '@/components/asprak/AsprakTable';
import AsprakAddModal from '@/components/asprak/AsprakAddModal';
import AsprakImportCSVModal from '@/components/asprak/AsprakImportCSVModal';
import AsprakExportModal from '@/components/asprak/AsprakExportModal';
import AsprakDetailsModal from '@/components/asprak/AsprakDetailsModal';
import AsprakEditModal from '@/components/asprak/AsprakEditModal';
import PlottingImportModal from '@/components/plotting/PlottingImportModal';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

import AsprakGenerationRules from '@/components/asprak/AsprakGenerationRules';
import AsprakDeleteDialog from '@/components/asprak/AsprakDeleteDialog';

interface AsprakWithAssignments extends Asprak {
  assignments?: AsprakAssignment[];
}

function AsprakPageContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'data';

  const {
    data: asprakList,
    loading,
    refetch: fetchAsprak,
    upsert,
    deleteAsprak,
    getAssignments,
    terms,
    selectedTerm,
    setSelectedTerm,
  } = useAsprak();
  const { praktikumNames: availablePraktikums } = usePraktikum();
  const [existingCodes, setExistingCodes] = useState<string[]>([]);
  const [allExistingNims, setAllExistingNims] = useState<ExistingNimInfo[]>([]);
  const [allExistingAspraks, setAllExistingAspraks] = useState<ExistingAsprakInfo[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsprak, setSelectedAsprak] = useState<AsprakWithAssignments | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPlottingImportModal, setShowPlottingImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<{ asprak: Asprak; assignments: string[] } | null>(
    null
  );

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Asprak | null>(null);

  // Fetch existing codes + all NIMs for conflict detection and code generation
  const refreshCodesAndNims = async () => {
    const [codesResult, allAsprakResult] = await Promise.all([
      fetchExistingCodes(),
      fetchAllAsprak(), // No term filter — gets ALL aspraks
    ]);
    if (codesResult.ok && codesResult.data) {
      setExistingCodes(codesResult.data);
    }
    if (allAsprakResult.ok && allAsprakResult.data) {
      setAllExistingNims(allAsprakResult.data.map((a) => ({ nim: a.nim, role: a.role })));
      setAllExistingAspraks(
        allAsprakResult.data.map((a) => ({ kode: a.kode, angkatan: a.angkatan ?? 0 }))
      );
    }
  };

  useEffect(() => {
    refreshCodesAndNims();
  }, []);

  const handleFormSubmit = async (data: UpsertAsprakInput) => {
    const result = await upsert(data);

    if (!result.ok) {
      throw new Error(result.error);
    }
    toast.success('Data berhasil disimpan!');
    setShowAddModal(false);
    fetchAsprak();
    refreshCodesAndNims();
  };

  const handleCSVImport = async (
    rows: {
      nim: string;
      nama_lengkap: string;
      kode: string;
      role: 'ASPRAK' | 'ASLAB';
      angkatan: number;
    }[],
    _term: string
  ) => {
    const result = await bulkImportAspraks(rows);

    if (!result.ok) {
      throw new Error(result.error || 'Gagal import data.');
    }

    const data = result.data!;
    const message = `Import selesai!\n\n✅ Inserted: ${data.inserted}\n🔄 Updated: ${data.updated}${data.skipped > 0 ? `\n⚠️ Skipped: ${data.skipped}` : ''}${data.errors.length > 0 ? `\n\nErrors:\n${data.errors.join('\n')}` : ''}`;

    toast.success('Import selesai!', {
      description: (
        <div className="mt-2 text-xs font-mono">
          <p>
            ✅ Inserted: <span className="font-bold">{data.inserted}</span>
          </p>
          <p>
            🔄 Updated: <span className="font-bold">{data.updated}</span>
          </p>
          {data.skipped > 0 && <p className="text-amber-500">⚠️ Skipped: {data.skipped}</p>}
          {data.errors.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-red-500 font-semibold mb-1">Errors:</p>
              <ul className="list-disc pl-4 space-y-1">
                {data.errors.slice(0, 3).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {data.errors.length > 3 && <li>...and {data.errors.length - 3} more</li>}
              </ul>
            </div>
          )}
        </div>
      ),
      duration: 5000,
    });
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

  // ─── Edit & Delete ────────────────────────────────────────────────────────

  const handleEditAsprak = async (asprak: Asprak) => {
    setLoadingDetails(true);
    const result = await getAssignments(asprak.id);

    // Map to IDs directly, getting all assignments across all terms
    const currentAssignmentIds = result.map((a) => a.praktikum.id);

    setEditTarget({
      asprak,
      assignments: currentAssignmentIds,
    });
    setLoadingDetails(false);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (
    praktikumIds: string[],
    newKode: string,
    forceOverride: boolean
  ) => {
    if (!editTarget) return;

    // Use 'all' to indicate global update
    const result = await updateAssignments(
      editTarget.asprak.id,
      'all',
      praktikumIds,
      newKode,
      editTarget.asprak.nim,
      forceOverride
    );

    if (result.ok) {
      toast.success('Penugasan berhasil diperbarui');
      fetchAsprak(); // Refresh list
    } else {
      toast.error(`Gagal memperbarui: ${result.error}`);
    }
  };

  const handleDeleteClick = (asprak: Asprak) => {
    setDeleteTarget(asprak);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const result = await deleteAsprak(deleteTarget.id);
    if (result.ok) {
      toast.success(`Berhasil menghapus ${deleteTarget.nama_lengkap}`);
      refreshCodesAndNims();
    } else {
      toast.error(`Gagal menghapus: ${result.error}`);
    }
    setDeleteTarget(null);
  };

  // ─── Filter ──────────────────────────────────────────────────────────────

  const filteredList = useMemo(() => {
    const list = asprakList;

    if (!searchQuery) return list;
    const lowerQ = searchQuery.toLowerCase();
    return list.filter((a) => {
      let roleText: string = a.role || 'ASPRAK';
      if (roleText === 'ASLAB') {
        const angkatan = a.angkatan || 0;
        const start = (angkatan + 3) % 100;
        const end = (angkatan + 4) % 100;
        const term = `${start.toString().padStart(2, '0')}${end.toString().padStart(2, '0')}`;
        roleText = `ASLAB ${term}`;
      }

      return (
        a.nama_lengkap.toLowerCase().includes(lowerQ) ||
        a.nim.includes(lowerQ) ||
        a.kode.toLowerCase().includes(lowerQ) ||
        roleText.toLowerCase().includes(lowerQ)
      );
    });
  }, [asprakList, searchQuery]);

  return (
    <div className="container" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Asisten Praktikum</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola daftar asisten praktikum</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 items-center w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-none min-w-0 md:whitespace-nowrap"
          >
            <Plus size={18} className="flex-shrink-0" />
            <span className="hidden sm:inline ml-1">Input Manual</span>
          </Button>

          {/* Import Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex-1 md:flex-none min-w-0 md:whitespace-nowrap">
                <Upload size={18} className="flex-shrink-0" />
                <span className="hidden sm:inline ml-1">Import CSV</span>
                <ChevronDown size={14} className="hidden sm:inline ml-1 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Pilih jenis import
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowImportModal(true)}>
                <Users size={15} className="mr-2 text-blue-500" />
                Import Data Asprak
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPlottingImportModal(true)}>
                <GitFork size={15} className="mr-2 text-violet-500" />
                Import Penugasan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={() => setShowExportModal(true)}
            className="flex-1 md:flex-none min-w-0 md:whitespace-nowrap"
          >
            <Download size={18} className="flex-shrink-0" />
            <span className="hidden sm:inline ml-1">Export Data</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsContent value="data">
          {/* Filters and Table */}
          <div className="card glass p-6 flex flex-col gap-6 border border-border/50">
            <AsprakFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              terms={terms}
              selectedTerm={selectedTerm}
              onTermChange={setSelectedTerm}
            />

            <AsprakTable data={filteredList} loading={loading} onViewDetails={handleView} />
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <AsprakGenerationRules />
        </TabsContent>
      </Tabs>

      {/* Manual Add Modal */}
      {showAddModal && (
        <AsprakAddModal
          onSubmit={handleFormSubmit}
          onClose={() => setShowAddModal(false)}
          open={showAddModal}
        />
      )}

      {/* CSV Import Modal — Data Asprak */}
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

      {/* CSV Import Modal — Penugasan (Plotting) */}
      <PlottingImportModal
        open={showPlottingImportModal}
        onOpenChange={setShowPlottingImportModal}
        onSuccess={() => {
          /* plotting tidak ditampilkan di page ini, cukup toast */
        }}
        terms={terms}
      />

      {/* Export Modal */}
      {showExportModal && (
        <AsprakExportModal onClose={() => setShowExportModal(false)} open={showExportModal} />
      )}

      {/* Details Modal */}
      {selectedAsprak && (
        <AsprakDetailsModal
          asprak={selectedAsprak}
          loading={loadingDetails}
          onEdit={handleEditAsprak}
          onDelete={handleDeleteClick}
          onClose={closeDetails}
          open={!!selectedAsprak}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editTarget && (
        <AsprakEditModal
          asprak={editTarget.asprak}
          term={selectedTerm || terms[0]}
          assignments={editTarget.assignments}
          onSave={handleSaveEdit}
          onClose={() => setShowEditModal(false)}
          open={showEditModal}
        />
      )}

      {/* Delete Dialog */}
      <AsprakDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        name={deleteTarget?.nama_lengkap || ''}
      />
    </div>
  );
}

function AsprakSkeleton() {
  return (
    <div className="container">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="w-full">
        {/* Tabs Skeleton */}
        <div className="flex gap-4 mb-6 border-b pb-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>

        {/* Card Skeleton */}
        <div className="card glass p-6 space-y-6 border border-border/50">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Skeleton className="h-10 flex-1 w-full" />
            <Skeleton className="h-10 w-full sm:w-[180px]" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AsprakPage() {
  return (
    <Suspense fallback={<AsprakSkeleton />}>
      <AsprakPageContent />
    </Suspense>
  );
}
