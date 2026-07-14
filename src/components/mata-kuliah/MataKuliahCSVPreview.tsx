import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, AlertTriangle, ArrowLeft, Save, X, Plus, Ban } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
  validPraktikums: { id: string; nama: string }[];
  term: string;
  onUpdateRow: (index: number, updates: Partial<MataKuliahCSVRow>) => void;
  onToggleSelect: (index: number) => void;
  onToggleAll: (checked: boolean) => void;
}

const PRODI_OPTIONS = ['IF', 'IF-PJJ', 'IT', 'IT-PJJ', 'SE', 'SE-PJJ', 'DS', 'DS-PJJ'];

const isValidProdi = (prodi: string) => {
  const base = prodi.replace('-PJJ', '');
  return ['IF', 'IT', 'SE', 'DS'].includes(base);
};

export default function MataKuliahCSVPreview({
  rows,
  validPraktikums,
  term,
  onUpdateRow,
  onToggleSelect,
  onToggleAll,
}: MataKuliahCSVPreviewProps) {
  const totalError = rows.filter((r) => r.status === 'error').length;

  const selectableRows = rows.filter((r) => r.status !== 'error');
  const selectedCount = selectableRows.filter((r) => r.selected).length;
  const allSelected = selectableRows.length > 0 && selectedCount === selectableRows.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < selectableRows.length;


  return (
    <div className="space-y-4">
      {/* 1. Statistics / Header */}
      <div className="flex flex-wrap gap-3 items-center">
        <Badge variant="outline" className="text-sm px-3 py-1">
          Term: <span className="font-bold ml-1">{term}</span>
        </Badge>
        <Badge variant="outline" className="text-sm px-3 py-1">
          Total: <span className="font-bold ml-1">{rows.length}</span>
        </Badge>
        <Badge
          variant={selectedCount > 0 ? 'default' : 'outline'}
          className="text-sm px-3 py-1"
        >
          Dipilih: <span className="font-bold ml-1">{selectedCount}</span>
        </Badge>

        {totalError > 0 && (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/30 text-sm px-3 py-1">
            <X size={14} className="mr-1" />
            {totalError} Errors
          </Badge>
        )}
      </div>

      {/* 2. Scrollable Table Area */}
      <div className="rounded-lg border border-border overflow-hidden">
        <ScrollArea className="h-[400px]">
          <table className="w-max min-w-full text-sm border-collapse">
            <thead className="bg-muted/50 sticky top-0 z-30">
              <tr>
                <th className="px-3 py-2.5 text-center border-b border-border w-[40px]">
                  <Checkbox
                    checked={allSelected ? true : isIndeterminate ? 'indeterminate' : false}
                    onCheckedChange={(checked) => onToggleAll(!!checked)}
                    disabled={selectableRows.length === 0}
                  />
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border w-10">
                  #
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border min-w-[200px]">
                  MK Singkat (Praktikum)
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border min-w-[300px]">
                  Nama Lengkap
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border min-w-[100px]">
                  Prodi
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border min-w-[80px]">
                  Koord
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border min-w-[150px]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
            {rows.map((row, idx) => {
              // Validations
              const isMkUnknown =
                !validPraktikums.some((p) => p.nama === row.mk_singkat) && !row.mappedPraktikumId;
              const isProdiInvalid = !isValidProdi(row.program_studi);
              const isKoorInvalid = row.dosen_koor.length !== 3;
              const isDisabled = row.status === 'error';
              const isDuplicate = row.statusMessage?.includes('Duplicate');

              return (
                <tr
                  key={`${row.mk_singkat}-${row.nama_lengkap}-${row.program_studi}`}
                  className={`
                    border-b border-border/50 transition-colors
                    ${row.status === 'error' ? 'bg-red-500/5' : ''}
                    ${row.status === 'warning' ? 'bg-amber-500/5' : ''}
                    ${!isDisabled && row.selected ? 'bg-muted/40' : ''}
                    hover:bg-muted/60
                  `}
                >
                  <td className="px-3 py-2 text-center">
                    <Checkbox
                      checked={row.selected}
                      onCheckedChange={() => onToggleSelect(idx)}
                      disabled={isDisabled}
                      className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{idx + 1}</td>

                  {/* MK Singkat / Mapping */}
                  <td className="px-3 py-2 font-medium">
                    <div className="flex flex-col gap-1 w-full max-w-[220px]">
                      <span className={isMkUnknown ? 'text-amber-600 font-bold' : 'font-semibold'}>
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
                            const nextStatus = prodiOk && koorOk ? 'ok' : 'error';

                            onUpdateRow(idx, {
                              mk_singkat: newMkSingkat,
                              mappedPraktikumId: newMappedId,
                              status: nextStatus as any,
                              selected: nextStatus === 'ok',
                            });
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs w-full bg-background border-input/80">
                            <SelectValue placeholder="Map to..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">
                              <span className="flex items-center text-emerald-600 font-bold">
                                <Plus className="mr-1 h-3 w-3" /> Buat Baru ({row.originalMkSingkat}
                                )
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
                  <td className="px-3 py-2 text-sm">
                    <div
                      className="max-w-[400px] text-wrap break-words leading-snug"
                      title={row.nama_lengkap}
                    >
                      {row.nama_lengkap}
                    </div>
                  </td>

                  {/* Prodi Validation */}
                  <td className="px-3 py-2">
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
                            const currentMkValid =
                              validPraktikums.some((p) => p.nama === row.mk_singkat) ||
                              row.mappedPraktikumId ||
                              row.status !== 'warning';
                            const nextStatus = koorOk && currentMkValid ? 'ok' : 'error';

                            onUpdateRow(idx, {
                              program_studi: val,
                              status: nextStatus as any,
                              selected: nextStatus === 'ok',
                            });
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 w-full">
                            <SelectValue placeholder="Fix" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODI_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </td>

                  {/* Dosen Validation */}
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1 w-[80px]">
                      <span
                        className={`font-mono ${isKoorInvalid ? 'text-red-500 font-bold' : ''}`}
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
                              const mkValid =
                                validPraktikums.some((p) => p.nama === row.mk_singkat) ||
                                row.mappedPraktikumId ||
                                row.status === 'ok';
                              const nextStatus =
                                prodiOk && val.length === 3 && mkValid ? 'ok' : 'error';

                              onUpdateRow(idx, {
                                dosen_koor: val,
                                status: nextStatus as any,
                                selected: nextStatus === 'ok',
                              });
                            }
                          }}
                        />
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-2">
                    {row.status === 'ok' && (
                      <span className="inline-flex items-center gap-1 text-emerald-500 text-xs">
                        <CheckCircle size={14} />
                        {isMkUnknown ? 'Siap Import (Buat Baru)' : 'Siap Import'}
                      </span>
                    )}
                    {row.status === 'warning' && (
                      <span className="inline-flex items-center gap-1 text-amber-500 text-xs">
                        <AlertTriangle size={14} /> Check Data
                      </span>
                    )}
                    {row.status === 'error' && (
                      <span
                        className="inline-flex items-center gap-1 text-red-500 text-xs"
                        title={row.statusMessage}
                      >
                        {isDuplicate ? (
                          <>
                            <Ban size={14} /> Duplicate
                          </>
                        ) : (
                          <>
                            <X size={14} /> {row.statusMessage || 'Error'}
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
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
