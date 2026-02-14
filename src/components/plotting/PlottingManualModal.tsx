'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchAllAsprak } from '@/lib/fetchers/asprakFetcher';
import { fetchPraktikumByTerm } from '@/lib/fetchers/praktikumFetcher';
import { savePlotting } from '@/lib/fetchers/plottingFetcher'; // Reuse save
import { Asprak, Praktikum } from '@/types/database';

interface PlottingManualModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  terms: string[];
}

export default function PlottingManualModal({
  open,
  onOpenChange,
  onSuccess,
  terms,
}: PlottingManualModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedAsprak, setSelectedAsprak] = useState('');
  const [selectedPraktikum, setSelectedPraktikum] = useState('');
  
  const [aspraks, setAspraks] = useState<Asprak[]>([]);
  const [praktikums, setPraktikums] = useState<Praktikum[]>([]);

  // Fetch Aspraks once
  useEffect(() => {
    if (open) {
        setLoading(true);
        fetchAllAsprak().then(res => {
            if (res.ok && res.data) setAspraks(res.data);
            setLoading(false);
        });
    }
  }, [open]);

  // Fetch Praktikums when term changes
  useEffect(() => {
      if (selectedTerm) {
          fetchPraktikumByTerm(selectedTerm).then(res => {
              if (res.ok && res.data) setPraktikums(res.data);
              else setPraktikums([]);
          });
      } else {
          setPraktikums([]);
      }
      setSelectedPraktikum('');
  }, [selectedTerm]);

  const handleSubmit = async () => {
      if (!selectedAsprak || !selectedPraktikum) {
          toast.error("Please select Asprak and Course");
          return;
      }
      
      setSubmitting(true);
      const result = await savePlotting([{
          asprak_id: selectedAsprak,
          praktikum_id: selectedPraktikum
      }]);
      
      setSubmitting(false);
      
      if (result.ok) {
          toast.success("Assignment saved successfully");
          onSuccess();
          onOpenChange(false);
          // Reset
          setSelectedAsprak('');
          setSelectedPraktikum('');
      } else {
          toast.error(`Failed to save: ${result.error}`);
      }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(700px,85vh)] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4">Input Manual Plotting</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 grid gap-6">
                {/* Term */}
                <div className="grid gap-2">
                    <Label>Term</Label>
                    <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                        <SelectTrigger><SelectValue placeholder="Select Term" /></SelectTrigger>
                        <SelectContent>
                            {terms.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                
                {/* Praktikum (Dependent on Term) */}
                <div className="grid gap-2">
                    <Label>Course (Praktikum)</Label>
                    <Select value={selectedPraktikum} onValueChange={setSelectedPraktikum} disabled={!selectedTerm}>
                        <SelectTrigger><SelectValue placeholder="Select Course" /></SelectTrigger>
                        <SelectContent>
                            {praktikums.map(p => <SelectItem key={p.id} value={p.id}>{p.nama}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                
                {/* Asprak */}
                <div className="grid gap-2">
                    <Label>Asprak</Label>
                    {loading ? (
                        <div className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Loading aspraks...</div>
                    ) : (
                        <Select value={selectedAsprak} onValueChange={setSelectedAsprak}>
                            <SelectTrigger><SelectValue placeholder="Select Asprak" /></SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                {aspraks.map(a => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {a.nama_lengkap} ({a.kode})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>
        </ScrollArea>

        <div className="border-t px-6 py-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !selectedAsprak || !selectedPraktikum}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Assign
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

}
