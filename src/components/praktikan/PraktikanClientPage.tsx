'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Upload, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PraktikanRecord, PraktikanOptions } from './types';
import PraktikanFilters, { ALL_KELAS_VALUE, ALL_MATA_KULIAH_VALUE } from './PraktikanFilters';
import PraktikanTable from './PraktikanTable';
import PraktikanAddModal from './PraktikanAddModal';
import PraktikanImportCSVModal from './PraktikanImportCSVModal';
import PraktikanEditModal from './PraktikanEditModal';
import PraktikanDeleteDialog from './PraktikanDeleteDialog';
import PraktikanBulkDeleteDialog from './PraktikanBulkDeleteDialog';

export default function PraktikanClientPage() {
  const [rows, setRows] = useState<PraktikanRecord[]>([]);
  const [options, setOptions] = useState<PraktikanOptions>({ kelas: [], mata_kuliah: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [mataKuliahFilter, setMataKuliahFilter] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  const [editTarget, setEditTarget] = useState<PraktikanRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PraktikanRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [bulkDeleteKelas, setBulkDeleteKelas] = useState('');
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (kelasFilter.trim()) params.set('kelas', kelasFilter.trim());
      if (mataKuliahFilter.trim()) params.set('mata_kuliah', mataKuliahFilter.trim());

      const response = await fetch(`/api/praktikan?${params.toString()}`);
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Gagal mengambil data praktikan.');
      }

      setRows(result.data ?? []);
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengambil data praktikan.');
    } finally {
      setLoading(false);
    }
  }, [kelasFilter, mataKuliahFilter]);

  const fetchOptions = useCallback(async () => {
    try {
      const optionsResponse = await fetch('/api/praktikan?action=options');
      const optionsResult = await optionsResponse.json();
      const baseOptions = optionsResult.data ?? { kelas: [], mata_kuliah: [] };

      let kelas = baseOptions.kelas;

      if (mataKuliahFilter.trim()) {
        const params = new URLSearchParams({ mata_kuliah: mataKuliahFilter.trim() });
        const kelasResponse = await fetch(`/api/praktikan/kelas?${params.toString()}`);
        const kelasResult = await kelasResponse.json();
        kelas = kelasResult.data ?? [];
      }

      setOptions({
        kelas,
        mata_kuliah: baseOptions.mata_kuliah,
      });

      if (kelasFilter && !kelas.includes(kelasFilter)) setKelasFilter('');
      if (bulkDeleteKelas && !kelas.includes(bulkDeleteKelas)) setBulkDeleteKelas('');
    } catch (error) {
      console.error('Failed to fetch options', error);
    }
  }, [kelasFilter, bulkDeleteKelas, mataKuliahFilter]);

  useEffect(() => {
    fetchRows();
    fetchOptions();
  }, [fetchOptions, fetchRows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return rows;

    return rows.filter((row) =>
      [row.nama, row.kelas, row.kode_asprak ?? '', row.mata_kuliah].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [searchQuery, rows]);

  const handleManualAdd = async (data: { nama: string; kelas: string; mata_kuliah: string; kode_asprak: string }) => {
    const response = await fetch('/api/praktikan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Gagal menyimpan data praktikan.');
    }
    
    toast.success('Data praktikan berhasil ditambahkan.');
    setShowAddModal(false);
    fetchRows();
    fetchOptions();
  };

  const handleImportCSV = async (importRows: Omit<PraktikanRecord, 'id' | 'created_at'>[]) => {
    const response = await fetch('/api/praktikan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: importRows }),
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Gagal menyimpan data praktikan.');
    }
    
    toast.success(`${result.data?.inserted ?? importRows.length} data praktikan berhasil diimport.`);
    setShowImportModal(false);
    fetchRows();
    fetchOptions();
  };

  const handleEditSave = async (id: string | number, data: any) => {
    const response = await fetch('/api/praktikan', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, data }),
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Gagal memperbarui data praktikan.');
    }

    toast.success('Data praktikan berhasil diperbarui.');
    fetchRows();
    fetchOptions();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/praktikan?id=${encodeURIComponent(String(deleteTarget.id))}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Gagal menghapus data praktikan.');
      }

      toast.success('Data praktikan dihapus.');
      setDeleteTarget(null);
      fetchRows();
      fetchOptions();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data praktikan.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!bulkDeleteKelas) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/praktikan?kelas=${encodeURIComponent(bulkDeleteKelas)}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Gagal menghapus data praktikan.');
      }

      toast.success(`${result.data?.deleted ?? 0} data dari kelas ${bulkDeleteKelas} dihapus.`);
      setBulkDeleteKelas('');
      setShowBulkDelete(false);
      fetchRows();
      fetchOptions();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus data kelas.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Only allow bulk delete from currently visible unique classes in filteredRows
  const availableClassesForDelete = useMemo(() => {
    return Array.from(new Set(filteredRows.map(r => r.kelas))).sort();
  }, [filteredRows]);

  return (
    <div className="container" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Praktikan</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola daftar mahasiswa praktikan secara terpusat</p>
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

          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="flex-1 md:flex-none min-w-0 md:whitespace-nowrap"
          >
            <Upload size={18} className="flex-shrink-0" />
            <span className="hidden sm:inline ml-1">Import CSV</span>
          </Button>

          <Button
            variant="destructive"
            onClick={() => {
              if (availableClassesForDelete.length > 0) {
                setBulkDeleteKelas(availableClassesForDelete[0]);
                setShowBulkDelete(true);
              } else {
                toast.error('Tidak ada data kelas yang dapat dihapus pada filter saat ini.');
              }
            }}
            disabled={availableClassesForDelete.length === 0}
            className="flex-1 md:flex-none min-w-0 md:whitespace-nowrap bg-red-600 hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800"
          >
            <Trash2 size={18} className="flex-shrink-0" />
            <span className="hidden sm:inline ml-1">Hapus Kelas</span>
          </Button>
        </div>
      </div>

      <div className="w-full">
        <div className="card glass p-6 flex flex-col gap-6 border border-border/50">
          <PraktikanFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            options={options}
            mataKuliahFilter={mataKuliahFilter}
            onMataKuliahFilterChange={setMataKuliahFilter}
            kelasFilter={kelasFilter}
            onKelasFilterChange={setKelasFilter}
          />

          <PraktikanTable
            data={filteredRows}
            loading={loading}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        </div>
      </div>

      {/* Modals */}
      <PraktikanAddModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleManualAdd}
      />

      <PraktikanImportCSVModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportCSV}
      />

      <PraktikanEditModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        praktikan={editTarget}
        onSave={handleEditSave}
      />

      <PraktikanDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        name={deleteTarget?.nama || ''}
        isDeleting={isDeleting}
      />

      <PraktikanBulkDeleteDialog
        open={showBulkDelete}
        onOpenChange={(open) => !open && setShowBulkDelete(false)}
        onConfirm={handleBulkDelete}
        kelas={bulkDeleteKelas}
        isDeleting={isDeleting}
      />
    </div>
  );
}
