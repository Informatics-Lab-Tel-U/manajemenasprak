
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import TermInput, { buildTermString } from '@/components/asprak/TermInput';

interface PraktikumManualModalProps {
  onConfirm: (nama: string, tahunAjaran: string) => Promise<void>;
  onClose: () => void;
  open: boolean;
  onCheckExists: (nama: string, tahunAjaran: string) => Promise<boolean>;
}

export default function PraktikumManualModal({
  onConfirm,
  onClose,
  open,
  onCheckExists,
}: PraktikumManualModalProps) {
  const [nama, setNama] = useState('');
  const [termYear, setTermYear] = useState('24');
  const [termSem, setTermSem] = useState<'1' | '2'>('2');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'exists' | 'available'>('idle');

  const term = buildTermString(termYear, termSem);

  const handleNamaChange = async (val: string) => {
    const upper = val.toUpperCase();
    setNama(upper);
    setStatus('idle');
  };

  const checkAvailability = async () => {
    if (!nama || term.length < 6) return;
    setStatus('checking');
    try {
        const exists = await onCheckExists(nama, term);
        setStatus(exists ? 'exists' : 'available');
    } catch (e) {
        setStatus('idle');
    }
  };

  const handleBlur = () => {
    if (nama && term) {
        checkAvailability();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !term) return;

    // Re-check before submit just in case
    setLoading(true);
    try {
        const exists = await onCheckExists(nama, term);
        if (exists) {
            setStatus('exists');
            setError('Praktikum sudah ada di database.');
            setLoading(false);
            return;
        }
        
        await onConfirm(nama, term);
        onClose();
        // Reset
        setNama('');
        setStatus('idle');
        setError(null);
    } catch (err: any) {
        setError(err.message || 'Gagal menyimpan.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Input Manual Praktikum</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
             {error && (
                <Alert className="border-destructive/50 text-destructive mb-2">
                  <AlertDescription className="flex items-center gap-2">
                    <X size={16} />
                    {error}
                  </AlertDescription>
                </Alert>
              )}

            <div className="space-y-2">
                <Label>Nama Singkat Matkul</Label>
                <div className="relative">
                    <Input 
                        value={nama} 
                        onChange={(e) => handleNamaChange(e.target.value)} 
                        onBlur={handleBlur}
                        placeholder="Contoh: PBO, JARKOM, STRUKDAT"
                        required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {status === 'checking' && <span className="text-xs text-muted-foreground animate-pulse">Checking...</span>}
                        {status === 'exists' && <AlertTriangle size={16} className="text-amber-500" />}
                        {status === 'available' && <CheckCircle size={16} className="text-emerald-500" />}
                    </div>
                </div>
                {status === 'exists' && (
                    <p className="text-xs text-amber-500">Praktikum ini sudah ada di database.</p>
                )}
                 {status === 'available' && (
                    <p className="text-xs text-emerald-500">Praktikum belum ada (Aman).</p>
                )}
            </div>

            <TermInput
                termYear={termYear}
                termSem={termSem}
                onYearChange={(y) => { setTermYear(y); setStatus('idle'); }}
                onSemChange={(s) => { setTermSem(s); setStatus('idle'); }}
            />

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                    Batal
                </Button>
                <Button type="submit" disabled={loading || status === 'exists' || !nama}>
                    {loading ? 'Menyimpan...' : 'Simpan'}
                </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
