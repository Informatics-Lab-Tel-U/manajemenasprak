'use client';

import React, { useState, useEffect } from 'react';
import { Jadwal, MataKuliah } from '@/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import JadwalPenggantiTable from '@/components/jadwal/JadwalPenggantiTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Edit, FilterX } from 'lucide-react';
import { toast } from 'sonner';
import * as jadwalFetcher from '@/lib/fetchers/jadwalFetcher';
import { JadwalPenggantiModal } from '@/components/jadwal/JadwalPenggantiModal';

interface JadwalPenggantiClientPageProps {
  initialTerms: string[];
  initialMataKuliah: MataKuliah[];
  initialAllJadwal: Jadwal[];
}

export default function JadwalPenggantiClientPage({
  initialTerms,
  initialMataKuliah,
  initialAllJadwal,
}: JadwalPenggantiClientPageProps) {
  const [terms] = useState<string[]>(initialTerms);
  const [selectedTerm, setSelectedTerm] = useState(initialTerms[0] || '');
  const [penggantiList, setPenggantiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const formatTime = (time: string | undefined | null) => {
    if (!time) return '-';
    // Handle ranges like "07:30 - 10:00" by taking the first part
    const startTime = time.split('-')[0].trim();
    // Handle HH:mm:ss or HH:mm
    const parts = startTime.split(':');
    if (parts.length >= 2) {
      const hh = parts[0].trim().padStart(2, '0');
      const mm = parts[1].trim().padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return startTime;
  };

  const fetchPengganti = React.useCallback(async () => {
    if (!selectedTerm) return;
    setLoading(true);
    const result = await jadwalFetcher.fetchJadwalPenggantiByTerm(selectedTerm);
    if (result.ok && result.data) {
      setPenggantiList(result.data);
    } else {
      toast.error('Gagal mengambil data jadwal jadwal pengganti');
    }
    setLoading(false);
  }, [selectedTerm]);

  useEffect(() => {
    fetchPengganti();
  }, [fetchPengganti]);

  const handleAdd = () => {
    setModalInitialData(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setModalInitialData(item);
    setIsModalOpen(true);
  };

  const handleDelete = (itemId: string) => {
    setDeleteId(itemId);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const result = await jadwalFetcher.deleteJadwalPengganti(deleteId);
    if (result.ok) {
      toast.success('Jadwal pengganti berhasil dihapus');
      fetchPengganti();
    } else {
      toast.error('Gagal menghapus: ' + result.error);
    }
    setDeleteId(null);
  };

  const handleSubmit = async (input: any) => {
    setIsSubmitting(true);
    const result = await jadwalFetcher.upsertJadwalPengganti(input);
    if (result.ok) {
      toast.success('Jadwal pengganti berhasil disimpan');
      await fetchPengganti();
      setIsSubmitting(false);
      return true;
    } else {
      toast.error('Gagal menyimpan: ' + result.error);
      setIsSubmitting(false);
      return false;
    }
  };

  return (
    <div className="container space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Jadwal Pengganti</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola semua jadwal pengganti praktikum
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-full md:w-[180px] bg-card/50 backdrop-blur-sm">
              <SelectValue placeholder="Pilih Term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleAdd} className="flex-1 sm:flex-none min-w-0 md:whitespace-nowrap">
            <Plus size={18} className="flex-shrink-0" />
            <span className="hidden sm:inline ml-2">Tambah Pengganti</span>
          </Button>
        </div>
      </div>

      <JadwalPenggantiTable
        data={penggantiList}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <JadwalPenggantiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={modalInitialData}
        mataKuliahList={initialMataKuliah}
        allJadwal={initialAllJadwal}
        isLoading={isSubmitting}
        currentTerm={selectedTerm}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jadwal Pengganti?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Jadwal pengganti ini akan dihapus secara
              permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              variant="destructive"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
