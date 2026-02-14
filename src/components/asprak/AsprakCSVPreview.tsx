/**
 * AsprakCSVPreview — Preview table for parsed CSV data
 *
 * Shows a table of parsed asprak rows before saving to database.
 * Highlights auto-generated codes and any validation issues.
 *
 * @module components/asprak/AsprakCSVPreview
 */

import { useState } from 'react';
import { CheckCircle, AlertTriangle, Sparkles, ArrowLeft, Save, Copy, FileCheck, CopyX, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

export interface PreviewRow {
  nama_lengkap: string;
  nim: string;
  kode: string;
  angkatan: number;
  codeRule: string;
  codeSource: 'csv' | 'generated';
  status: 'ok' | 'warning' | 'error' | 'duplicate-csv';
  statusMessage?: string;
  // Original values for tracking manual edits vs reverts
  originalKode: string;
  originalCodeRule: string;
  originalCodeSource: 'csv' | 'generated';
  selected: boolean;
}

interface AsprakCSVPreviewProps {
  rows: PreviewRow[];
  term: string;
  onConfirm: () => void;
  onBack: () => void;
  onCodeEdit: (rowIndex: number, newCode: string) => void;
  onToggleSelect: (rowIndex: number) => void;
  onToggleAll: (checked: boolean) => void;
  loading: boolean;
}

export default function AsprakCSVPreview({
  rows,
  term,
  onConfirm,
  onBack,
  onCodeEdit,
  onToggleSelect,
  onToggleAll,
  loading,
}: AsprakCSVPreviewProps) {
  const totalOk = rows.filter((r) => r.status === 'ok').length;
  const totalWarning = rows.filter((r) => r.status === 'warning').length;
  const totalError = rows.filter((r) => r.status === 'error').length;
  const totalDuplicateDB = rows.filter((r) => r.status === 'error' && r.statusMessage?.includes('Duplikat')).length;
  const totalDuplicateCSV = rows.filter((r) => r.status === 'duplicate-csv').length;
  const totalOtherErrors = totalError - totalDuplicateDB;
  const totalGenerated = rows.filter((r) => r.codeSource === 'generated' && r.status === 'ok').length;
  const totalManualEdit = rows.filter((r) => r.codeRule === 'Manual edit' && (r.status === 'ok' || r.status === 'warning')).length;
  const totalFromCSV = rows.filter((r) => r.codeSource === 'csv' && r.codeRule !== 'Manual edit' && r.status === 'ok').length;
  
  // Count selectable rows (OK or Warning)
  const selectableRows = rows.filter(r => r.status === 'ok' || r.status === 'warning');
  const selectedCount = selectableRows.filter(r => r.selected).length;
  const allSelected = selectableRows.length > 0 && selectedCount === selectableRows.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < selectableRows.length;

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="flex flex-wrap gap-3 items-center">
        <Badge variant="outline" className="text-sm px-3 py-1">
          Term: <span className="font-bold ml-1">{term}</span>
        </Badge>
        <Badge variant="outline" className="text-sm px-3 py-1">
          Total: <span className="font-bold ml-1">{rows.length}</span>
        </Badge>
        <Badge variant={selectedCount > 0 ? "default" : "outline"} className="text-sm px-3 py-1 transition-colors">
          Dipilih: <span className="font-bold ml-1">{selectedCount}</span>
        </Badge>
        {totalOk > 0 && (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-sm px-3 py-1">
            <CheckCircle size={14} className="mr-1" />
            {totalOk} OK
          </Badge>
        )}
        {totalDuplicateDB > 0 && (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/30 text-sm px-3 py-1">
            <Copy size={14} className="mr-1" />
            {totalDuplicateDB} Duplikat DB
          </Badge>
        )}
        {totalDuplicateCSV > 0 && (
          <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/30 text-sm px-3 py-1">
            <CopyX size={14} className="mr-1" />
            {totalDuplicateCSV} Duplikat CSV
          </Badge>
        )}
        {totalOtherErrors > 0 && (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/30 text-sm px-3 py-1">
            <AlertTriangle size={14} className="mr-1" />
            {totalOtherErrors} Error
          </Badge>
        )}
        {totalWarning > 0 && (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-sm px-3 py-1">
            <AlertTriangle size={14} className="mr-1" />
            {totalWarning} Warning
          </Badge>
        )}
        {totalFromCSV > 0 && (
          <Badge className="bg-sky-500/10 text-sky-500 border-sky-500/30 text-sm px-3 py-1">
            <FileCheck size={14} className="mr-1" />
            {totalFromCSV} Kode dari CSV
          </Badge>
        )}
        {totalGenerated > 0 && (
          <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/30 text-sm px-3 py-1">
            <Sparkles size={14} className="mr-1" />
            {totalGenerated} Auto-generated
          </Badge>
        )}
        {totalManualEdit > 0 && (
          <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/30 text-sm px-3 py-1">
            <Pencil size={14} className="mr-1" />
            {totalManualEdit} Manual edit
          </Badge>
        )}
      </div>

      {/* Preview Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2.5 text-center border-b border-border w-[40px]">
                  <Checkbox 
                    checked={allSelected ? true : isIndeterminate ? "indeterminate" : false}
                    onCheckedChange={(checked) => onToggleAll(!!checked)}
                    disabled={selectableRows.length === 0}
                  />
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border w-10">
                  #
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  Nama Lengkap
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  NIM
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  Kode
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  Angkatan
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  Rule
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isDuplicateDB = row.status === 'error' && row.statusMessage?.includes('Duplikat');
                const isDuplicateCSV = row.status === 'duplicate-csv';
                const isDuplicate = isDuplicateDB || isDuplicateCSV;
                const isDisabled = row.status === 'error' || row.status === 'duplicate-csv';
                
                return (
                <tr
                  key={idx}
                  className={`
                    border-b border-border/50 transition-colors
                    ${isDuplicateDB ? 'bg-red-500/10' : ''}
                    ${isDuplicateCSV ? 'bg-orange-500/10' : ''}
                    ${row.status === 'error' && !isDuplicate ? 'bg-red-500/5' : ''}
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
                      className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                    />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground font-mono text-xs">
                    {idx + 1}
                  </td>
                  <td className={`px-3 py-2 font-medium ${isDuplicate ? 'line-through opacity-50' : ''}`}>
                    {row.nama_lengkap}
                  </td>
                  <td className={`px-3 py-2 font-mono text-xs ${isDuplicate ? 'line-through opacity-50' : ''}`}>
                    {row.nim}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {isDuplicate ? (
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-md opacity-40 bg-muted/30 text-muted-foreground">
                        {row.kode || '—'}
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          value={row.kode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 3);
                            onCodeEdit(idx, val);
                          }}
                          maxLength={3}
                          className={`
                            w-[52px] text-center font-mono font-bold text-xs px-1.5 py-0.5 rounded-md
                            border outline-none transition-all
                            focus:ring-2 focus:ring-primary/40
                            ${!row.kode
                              ? 'border-amber-500/50 bg-amber-500/5 text-amber-400 placeholder:text-amber-400/50'
                              : row.codeSource === 'generated'
                                ? 'border-violet-500/30 bg-violet-500/10 text-violet-400'
                                : 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                            }
                          `}
                          placeholder="???"
                          title={row.codeRule}
                        />
                        {row.codeSource === 'generated' && row.kode && <Sparkles size={11} className="text-violet-400" />}
                        {row.codeSource === 'csv' && row.kode && row.codeRule !== 'Manual edit' && <FileCheck size={11} className="text-sky-400" />}
                        {row.codeRule === 'Manual edit' && <Pencil size={11} className="text-sky-400" />}
                      </div>
                    )}
                  </td>
                  <td className={`px-3 py-2 text-center font-mono text-xs ${isDuplicate ? 'opacity-50' : ''}`}>
                    {row.angkatan}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground font-mono truncate max-w-[150px]" title={row.codeRule}>
                    {row.codeRule || '-'}
                  </td>
                  <td className="px-3 py-2">
                    {row.status === 'ok' && (
                      <span className="inline-flex items-center gap-1 text-emerald-500 text-xs">
                        <CheckCircle size={14} /> OK
                      </span>
                    )}
                    {row.status === 'warning' && (
                      <span
                        className="inline-flex items-center gap-1 text-amber-500 text-xs"
                        title={row.statusMessage}
                      >
                        <AlertTriangle size={14} /> {row.statusMessage || 'Warning'}
                      </span>
                    )}
                    {row.status === 'error' && isDuplicateDB && (
                      <span className="inline-flex items-center gap-1 text-red-400 text-xs font-medium">
                        <Copy size={14} /> Duplikat DB
                      </span>
                    )}
                    {isDuplicateCSV && (
                      <span className="inline-flex items-center gap-1 text-orange-400 text-xs font-medium">
                        <CopyX size={14} /> Duplikat dalam CSV
                      </span>
                    )}
                    {row.status === 'error' && !isDuplicate && (
                      <span
                        className="inline-flex items-center gap-1 text-red-500 text-xs"
                        title={row.statusMessage}
                      >
                        <AlertTriangle size={14} /> {row.statusMessage || 'Error'}
                      </span>
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
          <ArrowLeft size={16} className="mr-1" />
          Kembali
        </Button>

        <div className="flex items-center gap-3">
          {(totalError + totalDuplicateCSV) > 0 && (
            <p className="text-xs text-amber-500">
              {totalError + totalDuplicateCSV} row(s) bermasalah akan di-skip saat import.
            </p>
          )}
          <Button
            onClick={onConfirm}
            disabled={loading || selectedCount === 0}
            variant="default"
          >
            <Save size={16} className="mr-1" />
            {loading
              ? 'Menyimpan...'
              : `Simpan ${selectedCount} Data Terpilih`}
          </Button>
        </div>
      </div>
    </div>
  );
}
