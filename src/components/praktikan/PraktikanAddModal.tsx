/* eslint-disable react-doctor/prefer-useReducer */
'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PraktikanAddModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { nama: string; kelas: string; mata_kuliah: string; kode_asprak: string }) => Promise<void>;
}

export default function PraktikanAddModal({ open, onClose, onSubmit }: PraktikanAddModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('');
  const [mataKuliah, setMataKuliah] = useState('');
  const [kodeAsprak, setKodeAsprak] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        nama: nama.trim().toUpperCase(),
        kelas: kelas.trim().toUpperCase(),
        mata_kuliah: mataKuliah.trim().toUpperCase(),
        kode_asprak: kodeAsprak.trim().toUpperCase(),
      };
      
      if (!payload.nama || !payload.kelas || !payload.mata_kuliah || !payload.kode_asprak) {
        toast.error('Nama, kelas, mata kuliah, dan kode asprak wajib diisi.');
        return;
      }
      
      await onSubmit(payload);
      setNama('');
      setKelas('');
      setMataKuliah('');
      setKodeAsprak('');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menambahkan praktikan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setNama('');
    setKelas('');
    setMataKuliah('');
    setKodeAsprak('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Input Manual Praktikan</DialogTitle>
          <DialogDescription>
            Masukkan data praktikan satu per satu. Pastikan kode asprak valid.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Lengkap</Label>
            <Input 
              placeholder="Nama praktikan" 
              value={nama} 
              onChange={(e) => setNama(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label>Kelas</Label>
            <Input 
              placeholder="IF-GABREM" 
              value={kelas} 
              onChange={(e) => setKelas(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label>Mata Kuliah</Label>
            <Input 
              placeholder="ALPRO" 
              value={mataKuliah} 
              onChange={(e) => setMataKuliah(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label>Kode Asprak</Label>
            <Input 
              placeholder="AFF" 
              value={kodeAsprak} 
              onChange={(e) => setKodeAsprak(e.target.value)} 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Simpan
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
