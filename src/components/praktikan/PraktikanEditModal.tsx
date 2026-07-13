/* eslint-disable react-doctor/no-cascading-set-state, react-doctor/prefer-useReducer */
'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PraktikanRecord } from './types';

interface PraktikanEditModalProps {
  open: boolean;
  onClose: () => void;
  praktikan: PraktikanRecord | null;
  onSave: (id: string | number, data: { nama: string; kelas: string; mata_kuliah: string; kode_asprak: string }) => Promise<void>;
}

export default function PraktikanEditModal({ open, onClose, praktikan, onSave }: PraktikanEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('');
  const [mataKuliah, setMataKuliah] = useState('');
  const [kodeAsprak, setKodeAsprak] = useState('');

  useEffect(() => {
    if (praktikan && open) {
      setNama(praktikan.nama);
      setKelas(praktikan.kelas);
      setMataKuliah(praktikan.mata_kuliah);
      setKodeAsprak(praktikan.kode_asprak || '');
    }
  }, [praktikan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!praktikan) return;
    
    try {
      setIsSubmitting(true);
      const payload = {
        nama: nama.trim().toUpperCase(),
        kelas: kelas.trim().toUpperCase(),
        mata_kuliah: mataKuliah.trim().toUpperCase(),
        kode_asprak: kodeAsprak.trim().toUpperCase(),
      };
      
      if (!payload.nama || !payload.kelas || !payload.mata_kuliah) {
        toast.error('Nama, kelas, dan mata kuliah wajib diisi.');
        return;
      }
      
      await onSave(praktikan.id, payload);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui praktikan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Data Praktikan</DialogTitle>
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
            <Label>Kode Asprak (Opsional)</Label>
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
              <Save className="mr-2" size={16} />
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
