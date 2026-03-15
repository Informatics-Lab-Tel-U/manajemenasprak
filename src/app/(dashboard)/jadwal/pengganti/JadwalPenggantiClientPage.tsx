'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Jadwal, MataKuliah } from '@/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Trash2, 
  Edit,
  History,
  FilterX
} from 'lucide-react';
import { toast } from 'sonner';
import * as jadwalFetcher from '@/lib/fetchers/jadwalFetcher';
import { JadwalPenggantiModal } from '@/components/jadwal/JadwalPenggantiModal';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

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

  const fetchPengganti = async () => {
    if (!selectedTerm) return;
    setLoading(true);
    const result = await jadwalFetcher.fetchJadwalPenggantiByTerm(selectedTerm);
    if (result.ok && result.data) {
      setPenggantiList(result.data);
    } else {
      toast.error('Gagal mengambil data jadwal pengganti');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPengganti();
  }, [selectedTerm]);

  const handleAdd = () => {
    setModalInitialData(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setModalInitialData(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal pengganti ini?')) return;
    
    const result = await jadwalFetcher.deleteJadwalPengganti(itemId);
    if (result.ok) {
      toast.success('Jadwal pengganti berhasil dihapus');
      fetchPengganti();
    } else {
      toast.error('Gagal menghapus: ' + result.error);
    }
  };

  const handleSubmit = async (input: any) => {
    setIsSubmitting(true);
    const result = await jadwalFetcher.upsertJadwalPengganti(input);
    setIsSubmitting(false);
    
    if (result.ok) {
      toast.success('Jadwal pengganti berhasil disimpan');
      fetchPengganti();
      return true;
    } else {
      toast.error('Gagal menyimpan: ' + result.error);
      return false;
    }
  };

  return (
    <div className="container space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Jadwal Pengganti</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola semua jadwal pengganti praktikum</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-full md:w-[180px] bg-card/50 backdrop-blur-sm">
              <SelectValue placeholder="Pilih Term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleAdd}
            className="flex-1 sm:flex-none min-w-0 md:whitespace-nowrap"
          >
            <Plus size={18} className="flex-shrink-0" />
            <span className="hidden sm:inline ml-2">Tambah Pengganti</span>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[200px]">Mata Kuliah</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Modul</TableHead>
                <TableHead className="min-w-[180px]">Jadwal Asli</TableHead>
                <TableHead className="min-w-[200px]">Jadwal Pengganti</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : penggantiList.length > 0 ? (
                penggantiList.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{item.jadwal?.mata_kuliah?.nama_lengkap}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {item.jadwal?.mata_kuliah?.praktikum?.nama}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-background">{item.jadwal?.kelas}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                        Modul {item.modul}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground">
                          {formatTime(item.jadwal?.jam)}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-medium">
                          <span>SESI {item.jadwal?.sesi || '-'}</span>
                          <span>•</span>
                          <span>{item.jadwal?.ruangan || 'N/A'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-primary">
                          {formatTime(item.jam)}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase font-medium">
                          <span>SESI {item.sesi}</span>
                          <span className="text-primary/50">•</span>
                          <span className="text-primary/80">{item.ruangan}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <FilterX size={40} className="opacity-20" />
                      <p>Tidak ada jadwal pengganti ditemukan untuk term ini.</p>
                      <Button variant="link" onClick={handleAdd}>Tambah Jadwal Pengganti Pertama</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

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
    </div>
  );
}
