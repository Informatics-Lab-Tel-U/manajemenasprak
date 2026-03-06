
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, AlertTriangle, ArrowLeft, Save, X, Plus, Ban } from 'lucide-react';
// Table imports removed as we use native table for better scroll control
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface MataKuliahCSVRow {
  mk_singkat: string;
  nama_lengkap: string;
  program_studi: string;
  dosen_koor: string;
  status: 'ok' | 'warning' | 'error';
  statusMessage?: string;
  mappedPraktikumId?: string;
  originalMkSingkat: string;
  selected?: boolean;
}

interface MataKuliahCSVPreviewProps {
  rows: MataKuliahCSVRow[];
  loading: boolean;
  validPraktikums: { id: string; nama: string }[];
  term: string;
  onConfirm: () => void;
  onBack: () => void;
  onUpdateRow: (index: number, updates: Partial<MataKuliahCSVRow>) => void;
  onToggleSelect: (index: number) => void;
  onToggleAll: (checked: boolean) => void;
  onSkip?: () => void;
}

export default function MataKuliahCSVPreview({
  rows,
  loading,
  validPraktikums,
  term,
  onConfirm,
  onBack,
  onUpdateRow,
  onToggleSelect,
  onToggleAll,
  onSkip
}: MataKuliahCSVPreviewProps) {
  const totalOk = rows.filter((r) => r.status === 'ok').length;
  const totalError = rows.filter((r) => r.status === 'error').length;
  const totalWarning = rows.filter((r) => r.status === 'warning').length;
  
  const selectableRows = rows.filter(r => r.status !== 'error');
  const selectedCount = selectableRows.filter(r => r.selected).length;
  const allSelected = selectableRows.length > 0 && selectedCount === selectableRows.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < selectableRows.length;

  const isValidProdi = (prodi: string) => {
    const base = prodi.replace('-PJJ', '');
    return ['IF', 'IT', 'SE', 'DS'].includes(base);
  };

  const PRODI_OPTIONS = [
    'IF', 'IF-PJJ',
    'IT', 'IT-PJJ',
    'SE', 'SE-PJJ',
    'DS', 'DS-PJJ'
  ];

  return (
    <div className="flex flex-col h-full w-full bg-background relative">
      {/* 1. Statistics / Header - Fixed at top of preview area */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background/95 backdrop-blur z-20 shrink-0">
         <div className="flex flex-wrap gap-2 items-center text-sm">
            <Badge variant="outline" className="px-3 py-1 bg-muted/50">
            Term: <span className="font-bold ml-1">{term}</span>
            </Badge>
            <Badge variant="outline" className="px-3 py-1 bg-muted/50">
            Total: <span className="font-bold ml-1">{rows.length}</span>
            </Badge>
            <Badge variant={selectedCount > 0 ? "default" : "outline"} className="px-3 py-1 transition-colors">
            Dipilih: <span className="font-bold ml-1">{selectedCount}</span>
            </Badge>
            
            {totalError > 0 && (
                <Badge className="bg-red-500/10 text-red-500 border-red-500/20 px-3 py-1">
                    <X size={13} className="mr-1" />
                    {totalError} Errors
                </Badge>
            )}
         </div>
      </div>

      {/* 2. Scrollable Table Area */}
      <div className="flex-1 w-full overflow-auto relative border-b">
        <table className="w-max min-w-full caption-bottom text-sm">
          <thead className="bg-muted sticky top-0 z-30 shadow-sm [&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-10 px-2 text-center sticky left-0 bg-muted z-40 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[50px]">
                  <Checkbox 
                    checked={allSelected ? true : isIndeterminate ? "indeterminate" : false}
                    onCheckedChange={(checked) => onToggleAll(!!checked)}
                    disabled={selectableRows.length === 0}
                  />
              </th>
              <th className="h-10 px-2 text-center align-middle font-medium text-muted-foreground w-[50px]">#</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground min-w-[200px]">MK Singkat (Praktikum)</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground min-w-[300px]">Nama Lengkap</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground min-w-[100px]">Prodi</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground min-w-[80px]">Koord</th>
              <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px]">Status</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {rows.map((row, idx) => {
              // Validations
              const isMkUnknown =
                !validPraktikums.some((p) => p.nama === row.mk_singkat) &&
                !row.mappedPraktikumId;
              const isProdiInvalid = !isValidProdi(row.program_studi);
              const isKoorInvalid = row.dosen_koor.length !== 3;
              const isDisabled = row.status === 'error';
              const isDuplicate = row.statusMessage?.includes('Duplicate');

              return (
                <tr
                  key={idx}
                  className={cn(
                    "border-b transition-colors data-[state=selected]:bg-muted",
                    row.status === 'error'
                      ? 'bg-red-500/5 hover:bg-red-500/10 data-[state=selected]:bg-red-500/10'
                      : row.status === 'warning'
                      ? 'bg-amber-500/5 hover:bg-amber-500/10 data-[state=selected]:bg-amber-500/10'
                      : (row.selected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50')
                  )}
                  data-state={row.selected ? 'selected' : undefined}
                >
                  {/* Sticky Checkbox */}
                  <td className="p-2 text-center sticky left-0 z-20 bg-inherit border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[50px] align-middle">
                      <div className="w-full h-full flex items-center justify-center bg-background/95 backdrop-blur-[1px] absolute inset-0 -z-10" />
                      <div className={cn(
                          "w-full h-full flex items-center justify-center absolute inset-0 -z-10",
                          row.status === 'error' ? 'bg-red-50/90' : row.status === 'warning' ? 'bg-amber-50/90' : 'bg-background' 
                      )} />
                      
                      <div className="flex items-center justify-center">
                        <Checkbox 
                            checked={row.selected}
                            onCheckedChange={() => onToggleSelect(idx)}
                            disabled={isDisabled}
                            className={isDisabled ? "opacity-50 cursor-not-allowed z-30" : "z-30"}
                        />
                      </div>
                  </td>
                  <td className="p-2 align-middle font-mono text-xs text-muted-foreground text-center">
                    {idx + 1}
                  </td>

                  {/* MK Singkat / Mapping */}
                  <td className="p-2 align-middle">
                    <div className="flex flex-col gap-1 w-full max-w-[220px]">
                      <span
                        className={
                          isMkUnknown ? 'text-amber-600 font-bold' : 'font-semibold'
                        }
                      >
                        {row.mk_singkat}
                      </span>
                      {isMkUnknown && !isDuplicate && (
                        <Select
                          value={row.mappedPraktikumId || 'new'}
                          onValueChange={(val) => {
                            let newMkSingkat = row.mk_singkat;
                            let newMappedId: string | undefined = undefined;

                            if (val !== 'new') {
                                const p = validPraktikums.find((vp) => vp.id === val);
                                if (p) {
                                    newMkSingkat = p.nama;
                                    newMappedId = p.id;
                                }
                            } else {
                                newMkSingkat = row.originalMkSingkat;
                                newMappedId = undefined;
                            }

                            const prodiOk = isValidProdi(row.program_studi);
                            const koorOk = row.dosen_koor.length === 3;
                            const nextStatus = (prodiOk && koorOk) ? 'ok' : 'error';
                           
                            onUpdateRow(idx, {
                              mk_singkat: newMkSingkat,
                              mappedPraktikumId: newMappedId,
                              status: nextStatus as any,
                              selected: nextStatus === 'ok' 
                            });
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs w-full bg-background border-input/80">
                            <SelectValue placeholder="Map to..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">
                              <span className="flex items-center text-emerald-600 font-bold">
                                <Plus className="mr-1 h-3 w-3" /> Buat Baru ({row.originalMkSingkat})
                              </span>
                            </SelectItem>
                            {validPraktikums.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.nama}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </td>

                  {/* Nama Lengkap */}
                  <td className="p-2 align-middle text-sm">
                      <div className="max-w-[400px] text-wrap break-words leading-snug" title={row.nama_lengkap}>
                          {row.nama_lengkap}
                      </div>
                  </td>

                  {/* Prodi Validation */}
                  <td className="p-2 align-middle">
                    <div className="flex flex-col gap-1 w-[100px]">
                      <span
                        className={`font-mono font-bold ${
                          isProdiInvalid ? 'text-red-500 line-through' : ''
                        }`}
                      >
                        {row.program_studi}
                      </span>
                      {isProdiInvalid && !isDuplicate && (
                         <Select
                            value=""
                            onValueChange={(val) => {
                                const koorOk = row.dosen_koor.length === 3;
                                const currentMkValid = validPraktikums.some(p => p.nama === row.mk_singkat) || row.mappedPraktikumId || row.status !== 'warning';
                                const nextStatus = (koorOk && currentMkValid) ? 'ok' : 'error';

                                 onUpdateRow(idx, {
                                    program_studi: val,
                                    status: nextStatus as any,
                                    selected: nextStatus === 'ok'
                                });
                            }}
                         >
                            <SelectTrigger className="h-7 text-xs border-red-200 bg-red-50 text-red-600 w-full">
                                <SelectValue placeholder="Fix" />
                            </SelectTrigger>
                            <SelectContent>
                                {PRODI_OPTIONS.map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                         </Select>
                      )}
                    </div>
                  </td>

                  {/* Dosen Validation */}
                  <td className="p-2 align-middle">
                    <div className="flex flex-col gap-1 w-[80px]">
                      <span
                        className={`font-mono ${
                          isKoorInvalid ? 'text-red-500 font-bold' : ''
                        }`}
                      >
                        {row.dosen_koor}
                      </span>
                      {isKoorInvalid && !isDuplicate && (
                         <Input 
                            className="h-7 w-full text-center text-xs px-1 border-destructive/50 focus-visible:ring-destructive/20"
                            placeholder="???"
                            value={row.dosen_koor}
                            maxLength={3}
                            onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                if (val.length <= 3) {
                                     const prodiOk = isValidProdi(row.program_studi);
                                     const mkValid = validPraktikums.some(p => p.nama === row.mk_singkat) || row.mappedPraktikumId || row.status === 'ok'; 
                                     const nextStatus = (prodiOk && val.length === 3 && mkValid) ? 'ok' : 'error';

                                     onUpdateRow(idx, {
                                         dosen_koor: val,
                                         status: nextStatus as any,
                                         selected: nextStatus === 'ok'
                                     });
                                }
                            }}
                         />
                      )}
                    </div>
                  </td>

                  <td className="p-2 align-middle">
                    {row.status === 'ok' && (
                      <span className="flex items-center text-emerald-600 text-xs font-medium whitespace-nowrap bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 w-max">
                         <CheckCircle size={14} className="mr-1.5" /> 
                         {isMkUnknown ? 'Siap Import (Buat Baru)' : 'Siap Import'}
                      </span>
                    )}
                    {row.status === 'warning' && (
                      <span className="flex items-center text-amber-600 text-xs font-medium whitespace-nowrap bg-amber-50 px-2 py-1 rounded-full border border-amber-100 w-max">
                          <AlertTriangle size={14} className="mr-1.5" /> Check Data
                      </span>
                    )}
                    {row.status === 'error' && (
                      <span className="flex items-center text-red-600 text-xs font-medium whitespace-nowrap bg-red-50 px-2 py-1 rounded-full border border-red-100 w-max" title={row.statusMessage}>
                          {isDuplicate ? (
                              <>
                                <Ban size={14} className="mr-1.5" /> Duplicate
                              </>
                          ) : (
                              <>
                                <X size={14} className="mr-1.5" /> {row.statusMessage || 'Error'}
                              </>
                          )}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Footer Actions - Fixed at bottom */}
      <div className="flex justify-between items-center px-6 py-4 border-t bg-background shrink-0 gap-4 mt-auto shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)] z-30">
        <Button variant="outline" onClick={onBack} disabled={loading} className="shrink-0 min-w-[140px]">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Upload
        </Button>
        <div className="flex items-center gap-2 overflow-hidden justify-end flex-1">
          {totalError > 0 && (
            <span className="text-xs text-destructive font-medium mr-3 text-right hidden lg:inline-block">
              {totalError} data bermasalah & akan dilewati
            </span>
          )}
          {onSkip && (
              <Button type="button" variant="secondary" onClick={onSkip} disabled={loading} className="shrink-0 min-w-[140px]">
                 Lewati Langkah Ini
              </Button>
          )}
          <Button onClick={onConfirm} disabled={loading || selectedCount === 0} className="shrink-0 min-w-[160px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Menyimpan...' : `Simpan ${selectedCount} Data`}
          </Button>
        </div>
      </div>
    </div>
  );
}
