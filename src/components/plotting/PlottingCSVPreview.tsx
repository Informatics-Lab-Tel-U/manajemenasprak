
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertTriangle, ArrowLeft, Save, XCircle, HelpCircle } from 'lucide-react';

export interface PlottingPreviewRow {
  index: number;
  kode_asprak: string;
  mk_singkat: string;
  status: 'valid' | 'invalid' | 'ambiguous';
  message?: string;
  candidates?: { id: string; nama_lengkap: string; nim: string; angkatan: number }[];
  selectedCandidateIds?: string[];
  selected: boolean;
}

interface PlottingCSVPreviewProps {
  rows: PlottingPreviewRow[];
  term: string;
  onConfirm: () => void;
  onBack: () => void;
  onResolve: (rowIndex: number, candidateId: string) => void;
  onToggleSelect: (rowIndex: number) => void;
  onToggleAll: (checked: boolean) => void;
  loading: boolean;
  onSkip?: () => void;
}

export default function PlottingCSVPreview({
  rows,
  term,
  onConfirm,
  onBack,
  onResolve,
  onToggleSelect,
  onToggleAll,
  loading,
  onSkip,
}: PlottingCSVPreviewProps) {
  const totalValid = rows.filter(r => r.status === 'valid').length;
  // Resolved ambiguous rows count as valid for saving purposes?
  // Or just display "Ambiguous" count but with candidates selected?
  // User wants to see what's happening.
  // I'll keep them as 'ambiguous' status visually until resolved? 
  // Or if selectedCandidateIds > 0, consider them resolved?
  // The logic in parent `handleConfirm` handles saving.
  // Visual counts:
  const totalAmbiguous = rows.filter(r => r.status === 'ambiguous').length;
  const totalInvalid = rows.filter(r => r.status === 'invalid').length;
  
  const selectableRows = rows.filter(r => r.status !== 'invalid');
  const selectedCount = selectableRows.filter(r => r.selected).length;
  
  // Count actually savable assignments (Valid rows + Selected Candidates in Ambiguous rows)
  // Logic: Valid Row = 1 assignment. Ambiguous Row = N assignments (where N = selectedCandidateIds.length).
  // Only if row.selected is true.
  
  let validAssignmentsCount = 0;
  rows.forEach(r => {
      if (!r.selected) return;
      if (r.status === 'valid') validAssignmentsCount++;
      if (r.status === 'ambiguous' && r.selectedCandidateIds) {
          validAssignmentsCount += r.selectedCandidateIds.length;
      }
  });

  const allSelected = selectableRows.length > 0 && selectedCount === selectableRows.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < selectableRows.length;

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex flex-wrap gap-3 items-center">
        <Badge variant="outline" className="text-sm px-3 py-1">
          Term: <span className="font-bold ml-1">{term}</span>
        </Badge>
        <Badge variant="outline" className="text-sm px-3 py-1">
          Total Rows: <span className="font-bold ml-1">{rows.length}</span>
        </Badge>
        
        {totalValid > 0 && (
           <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-sm px-3 py-1">
             <CheckCircle size={14} className="mr-1" /> {totalValid} Valid
           </Badge>
        )}
        {totalAmbiguous > 0 && (
           <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-sm px-3 py-1">
             <HelpCircle size={14} className="mr-1" /> {totalAmbiguous} Ambiguous
           </Badge>
        )}
        {totalInvalid > 0 && (
           <Badge className="bg-red-500/10 text-red-500 border-red-500/30 text-sm px-3 py-1">
             <XCircle size={14} className="mr-1" /> {totalInvalid} Invalid
           </Badge>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2.5 text-center border-b w-[40px]">
                  <Checkbox 
                    checked={allSelected ? true : isIndeterminate ? "indeterminate" : false}
                    onCheckedChange={(c) => onToggleAll(!!c)}
                    disabled={selectableRows.length === 0}
                  />
                </th>
                <th className="px-3 py-2.5 text-left border-b w-10 text-muted-foreground">#</th>
                <th className="px-3 py-2.5 text-left border-b text-muted-foreground uppercase text-xs font-semibold">Kode Asprak</th>
                <th className="px-3 py-2.5 text-left border-b text-muted-foreground uppercase text-xs font-semibold">Mata Kuliah</th>
                <th className="px-3 py-2.5 text-left border-b text-muted-foreground uppercase text-xs font-semibold">Status</th>
                <th className="px-3 py-2.5 text-left border-b text-muted-foreground uppercase text-xs font-semibold w-[350px]">Resolution (Select Candidates)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isDisabled = row.status === 'invalid';
                const isAmbiguous = row.status === 'ambiguous';
                
                return (
                  <tr key={idx} className={`
                     border-b border-border/50 transition-colors
                     ${row.status === 'invalid' ? 'bg-red-500/5' : ''}
                     ${row.status === 'ambiguous' ? 'bg-amber-500/5' : ''}
                     ${!isDisabled && row.selected ? 'bg-muted/40' : ''}
                     hover:bg-muted/60
                  `}>
                    <td className="px-3 py-2 text-center align-top pt-3">
                      <Checkbox 
                        checked={row.selected}
                        onCheckedChange={() => onToggleSelect(idx)}
                        disabled={isDisabled}
                        className={isDisabled ? "opacity-50" : ""}
                      />
                    </td>
                    <td className="px-3 py-2 text-muted-foreground font-mono text-xs align-top pt-3">{idx + 1}</td>
                    <td className="px-3 py-2 font-mono font-bold align-top pt-3">{row.kode_asprak}</td>
                    <td className="px-3 py-2 font-mono align-top pt-3">{row.mk_singkat}</td>
                    <td className="px-3 py-2 align-top pt-3">
                       {row.status === 'valid' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={14}/> Valid</span>}
                       {row.status === 'invalid' && <span className="text-red-500 flex items-center gap-1" title={row.message}><XCircle size={14}/> {row.message || 'Error'}</span>}
                       {row.status === 'ambiguous' && <span className="text-amber-500 flex items-center gap-1"><HelpCircle size={14}/> Ambiguous</span>}
                    </td>
                    <td className="px-3 py-2">
                       {isAmbiguous && row.candidates && (
                          <div className="flex flex-col gap-2 border rounded-md p-2 bg-background/50">
                              {row.candidates.map(c => {
                                  const isSelected = row.selectedCandidateIds?.includes(c.id);
                                  return (
                                     <div key={c.id} className="flex items-start space-x-2">
                                         <Checkbox 
                                            id={`row-${idx}-cand-${c.id}`}
                                            checked={isSelected}
                                            onCheckedChange={() => onResolve(idx, c.id)}
                                         />
                                         <div className="grid gap-0.5 leading-none">
                                             <Label 
                                                htmlFor={`row-${idx}-cand-${c.id}`}
                                                className="text-xs font-medium cursor-pointer"
                                             >
                                                {c.nama_lengkap}
                                             </Label>
                                             <span className="text-[10px] text-muted-foreground font-mono">
                                                NIM: {c.nim} | Angkatan: {c.angkatan}
                                             </span>
                                         </div>
                                     </div>
                                  );
                              })}
                          </div>
                       )}
                       {!isAmbiguous && row.message && row.status !== 'valid' && (
                           <span className="text-xs text-muted-foreground truncate max-w-[280px] block" title={row.message}>
                               {row.message}
                           </span>
                       )}
                       {!isAmbiguous && row.status === 'valid' && row.message && (
                           <span className="text-xs text-muted-foreground">{row.message}</span>
                       )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-2">
         <Button variant="outline" onClick={onBack} disabled={loading}>
             <ArrowLeft size={16} className="mr-1" /> Back
         </Button>
         <div className="flex gap-2">
           {onSkip && (
              <Button type="button" variant="secondary" onClick={onSkip} disabled={loading}>
                 Lewati Langkah Ini
              </Button>
           )}
           <Button onClick={onConfirm} disabled={loading || validAssignmentsCount === 0} variant="default">
               <Save size={16} className="mr-1" />
               {loading ? 'Saving...' : `Save ${validAssignmentsCount} Assignments`}
           </Button>
         </div>
      </div>
    </div>
  );
}
