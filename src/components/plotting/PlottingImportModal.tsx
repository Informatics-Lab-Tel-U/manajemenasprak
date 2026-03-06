
'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Upload, X, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

import { validatePlottingImport, savePlotting } from '@/lib/fetchers/plottingFetcher';
import PlottingCSVPreview from './PlottingCSVPreview';
import { mapPlottingValidationResponse, handlePlottingResolve, ExtendedPreviewRow } from '@/utils/validation/plottingValidation';

interface PlottingImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  terms: string[];
}

export default function PlottingImportModal({
  open,
  onOpenChange,
  onSuccess,
  terms,
}: PlottingImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [previewRows, setPreviewRows] = useState<ExtendedPreviewRow[]>([]);

  // CSV Processing
  const processCSV = (file: File) => {
    setError(null);
    setFileName(file.name);
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        const rawRows = results.data.map((row: any) => ({
          kode_asprak: row.kode_asprak || '',
          mk_singkat: row.mk_singkat || '',
        })).filter((r: any) => r.kode_asprak && r.mk_singkat);

        if (rawRows.length === 0) {
          setError('CSV empty or missing columns (kode_asprak, mk_singkat)');
          setLoading(false);
          return;
        }

        // Validate via API
        const res = await validatePlottingImport(rawRows, selectedTerm);
        setLoading(false);

        if (res.ok && res.data) {
           const mapped = mapPlottingValidationResponse(res.data);
           
           setPreviewRows(mapped);
           setStep('preview');
        } else {
           setError(res.error || 'Validation failed');
        }
      },
      error: (e) => {
          setError(`CSV Error: ${e.message}`);
          setLoading(false);
      }
    });
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: { 'text/csv': ['.csv'] },
      maxFiles: 1,
      disabled: !selectedTerm,
      onDrop: (files) => files[0] && processCSV(files[0])
  });

  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    const data = [
      { kode_asprak: 'ARS', mk_singkat: 'PBO' },
      { kode_asprak: 'ZZA', mk_singkat: 'STRUKDAT' },
    ];

    if (format === 'csv') {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_plotting.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'template_plotting.xlsx');
    }
  };

  const handleResolve = (index: number, candidateId: string) => {
      setPreviewRows((prev) => handlePlottingResolve(index, candidateId, prev));
  };

  const handleConfirm = async () => {
      const payload: {asprak_id: string, praktikum_id: string}[] = [];
      
      previewRows.forEach(row => {
          if (!row.selected) return;
          if (row.status === 'invalid') return;
          
          // Valid rows
          if (row.status === 'valid' && row.asprakId && row.praktikumId) {
              payload.push({ asprak_id: row.asprakId, praktikum_id: row.praktikumId });
          }
          
          // Ambiguous rows (resolved via multiple selection)
          else if (row.status === 'ambiguous' && row.selectedCandidateIds && row.praktikumId) {
              row.selectedCandidateIds.forEach(id => {
                  payload.push({ asprak_id: id, praktikum_id: row.praktikumId! });
              });
          }
      });
      
      if (payload.length === 0) {
          toast.warning("No assignments to save");
          return;
      }

      setLoading(true);
      const res = await savePlotting(payload);
      setLoading(false);
      
      if (res.ok) {
          toast.success(`Saved ${payload.length} assignments successfully!`);
          onSuccess();
          handleClose();
      } else {
          toast.error(res.error);
      }
  };
  
  const handleClose = () => {
      setStep('upload');
      setPreviewRows([]);
      setFileName(null);
      setError(null);
      onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
       <DialogContent className={cn(
          "flex max-h-[min(800px,90vh)] flex-col gap-0 p-0",
          step === 'preview' ? "sm:max-w-4xl" : "sm:max-w-lg"
       )}>
          <DialogHeader className="contents space-y-0 text-left">
             <DialogTitle className="border-b px-6 py-4 flex items-center gap-2">
                <Upload size={18}/> Import CSV Plotting
             </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex max-h-full flex-col overflow-hidden">
             <div className="px-6 py-5">
                 {error && (
                    <Alert className="mb-4 text-destructive border-destructive/50">
                        <AlertDescription className="flex gap-2">
                             <X size={16} className="mt-0.5"/> {error}
                        </AlertDescription>
                    </Alert>
                 )}

                 {step === 'upload' && (
                     <div className="space-y-6">
                         <div className="space-y-2">
                             <Label>Tahun Ajaran Penugasan</Label>
                             <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                                 <SelectTrigger><SelectValue placeholder="Pilih Term" /></SelectTrigger>
                                 <SelectContent>
                                     {terms.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                 </SelectContent>
                             </Select>
                             <p className="text-xs text-muted-foreground">Isi term terlebih dahulu sebelum upload CSV.</p>
                         </div>

                         <div {...getRootProps()} 
                            className={cn(
                                "border-2 border-dashed rounded-lg p-10 text-center transition-all",
                                !selectedTerm ? "border-muted bg-muted/20 opacity-50 cursor-not-allowed" : 
                                isDragActive ? "border-primary bg-primary/5" : "hover:border-primary/50 cursor-pointer"
                            )}
                         >
                             <input {...getInputProps()} />
                             <FileSpreadsheet size={40} className="mx-auto mb-3 text-muted-foreground"/>
                             {!selectedTerm ? (
                                 <p className="font-medium text-muted-foreground">Pilih Term dulu</p>
                             ) : isDragActive ? (
                                 <p className="text-primary font-semibold">Drop file di sini...</p>
                             ) : (
                                 <div className="space-y-1">
                                    <p className="font-medium">Drag & drop CSV Asprak</p>
                                    <p className="text-xs text-muted-foreground">Format: kode_asprak, mk_singkat</p>
                                 </div>
                             )}
                         </div>

                         <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                            <p className="text-xs text-muted-foreground mb-2 font-medium">Format Kolom:</p>
                            <div className="flex flex-wrap gap-2 mb-1">
                              {['kode_asprak', 'mk_singkat'].map((col) => (
                                <span key={col} className="text-[10px] bg-background border px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                                  {col}
                                </span>
                              ))}
                            </div>
                            
                            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Download size={12} />
                                Download Template:
                              </span>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-xs px-2 gap-1.5 bg-background"
                                  onClick={() => handleDownloadTemplate('csv')}
                                >
                                  <FileText size={12} className="text-sky-500" />
                                  CSV
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 text-xs px-2 gap-1.5 bg-background"
                                  onClick={() => handleDownloadTemplate('xlsx')}
                                >
                                  <FileSpreadsheet size={12} className="text-emerald-500" />
                                  XLSX
                                </Button>
                              </div>
                            </div>
                          </div>
                     </div>
                 )}

                 {step === 'preview' && (
                     <PlottingCSVPreview
                        rows={previewRows}
                        term={selectedTerm}
                        onConfirm={handleConfirm}
                        onBack={() => { setStep('upload'); setPreviewRows([]); }}
                        onResolve={handleResolve}
                        onToggleSelect={(idx) => setPreviewRows(p => {
                            const u = [...p]; u[idx].selected = !u[idx].selected; return u;
                        })}
                        onToggleAll={(checked) => setPreviewRows(p => p.map(r => r.status==='invalid' ? r : {...r, selected: checked}))}
                        loading={loading}
                     />
                 )}
             </div>
          </ScrollArea>
       </DialogContent>
    </Dialog>
  );
}
