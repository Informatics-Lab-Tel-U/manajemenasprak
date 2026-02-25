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
import AsprakFilters from '@/components/asprak/AsprakFilters';
import AsprakTable from '@/components/asprak/AsprakTable';
import AsprakAddModal from '@/components/asprak/AsprakAddModal';
import AsprakImportCSVModal from '@/components/asprak/AsprakImportCSVModal';
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
  const [allExistingNims, setAllExistingNims] = useState<string[]>([]);
  const [allExistingAspraks, setAllExistingAspraks] = useState<ExistingAsprakInfo[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsprak, setSelectedAsprak] = useState<AsprakWithAssignments | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPlottingImportModal, setShowPlottingImportModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Edit State
  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<{ asprak: Asprak, assignments: string[] } | null>(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Asprak | null>(null);

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

  const handleFormSubmit = async (data: UpsertAsprakInput) => {
    const result = await upsert(data);

    if (!result.ok) {
      throw new Error(result.error);
    }

    toast.success('Data saved successfully!');
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

    toast.success('Import selesai!', {
      description: (
        <div className="mt-2 text-xs font-mono">
          <p>✅ Inserted: <span className="font-bold">{data.inserted}</span></p>
          <p>🔄 Updated: <span className="font-bold">{data.updated}</span></p>
          {data.skipped > 0 && <p className="text-amber-500">⚠️ Skipped: {data.skipped}</p>}
          {data.errors.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border">
               <p className="text-red-500 font-semibold mb-1">Errors:</p>
               <ul className="list-disc pl-4 space-y-1">
                 {data.errors.slice(0, 3).map((err, i) => <li key={i}>{err}</li>)}
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
    const currentAssignmentIds = result.map(a => a.praktikum.id);
        
    setEditTarget({
        asprak,
        assignments: currentAssignmentIds
    });
    setLoadingDetails(false);
    setShowEditModal(true);
  };
  
  const handleSaveEdit = async (praktikumIds: string[]) => {
      if (!editTarget) return;
      
      // Use 'all' to indicate global update
      const result = await updateAssignments(editTarget.asprak.id, 'all', praktikumIds);
      
      if (result.ok) {
          toast.success("Penugasan berhasil diperbarui");
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
       toast.success(`Deleted ${deleteTarget.nama_lengkap}`);
       refreshCodesAndNims();
     } else {
       toast.error(`Failed to delete: ${result.error}`);
     }
     setDeleteTarget(null);
  };

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



  // ... (rest of the hooks)

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

          {/* Import Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Upload size={18} />
                Import CSV
                <ChevronDown size={14} className="ml-1 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Pilih jenis import</DropdownMenuLabel>
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

          <Button variant="outline" onClick={() => toast.info('Fitur Export akan segera hadir')}>
            <Download size={18} />
            Export Data
          </Button>
          <Button
            variant={isEditMode ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setIsEditMode(!isEditMode)}
            className={isEditMode ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "text-muted-foreground"}
            title={isEditMode ? "Exit Edit Mode" : "Enable Edit Mode"}
          >
            {isEditMode ? <X size={20} /> : <Pencil size={20} />}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsContent value="data">
          {/* Filters and Table */}
          <div className="card glass" style={{ marginBottom: '2rem' }}>
            <AsprakFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              terms={terms}
              selectedTerm={selectedTerm}
              onTermChange={setSelectedTerm}
            />

            <AsprakTable 
              data={filteredList} 
              loading={loading} 
              onViewDetails={handleView}
              isEditMode={isEditMode}
              onEdit={handleEditAsprak}
              onDelete={handleDeleteClick}
            />
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
        onSuccess={() => { /* plotting tidak ditampilkan di page ini, cukup toast */ }}
        terms={terms}
      />

      {/* Details Modal */}
      {selectedAsprak && (
        <AsprakDetailsModal
          asprak={selectedAsprak}
          loading={loadingDetails}
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

export default function AsprakPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AsprakPageContent />
    </Suspense>
  );
}
