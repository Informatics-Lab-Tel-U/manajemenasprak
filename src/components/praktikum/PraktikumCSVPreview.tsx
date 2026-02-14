
'use client';

import { useState } from 'react';
import {  ArrowLeft, Save, CheckCircle, AlertTriangle, X  } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface PraktikumPreviewRow {
  nama: string;
  tahun_ajaran: string;
  status: 'ok' | 'skipped' | 'error';
  statusMessage?: string;
  selected: boolean;
}

interface PraktikumCSVPreviewProps {
  rows: PraktikumPreviewRow[];
  onConfirm: () => void;
  onBack: () => void;
  onToggleSelect: (rowIndex: number) => void;
  onToggleAll: (checked: boolean) => void;
  loading: boolean;
}

export default function PraktikumCSVPreview({
  rows,
  onConfirm,
  onBack,
  onToggleSelect,
  onToggleAll,
  loading,
}: PraktikumCSVPreviewProps) {
  const totalOk = rows.filter((r) => r.status === 'ok').length;
  const totalSkipped = rows.filter((r) => r.status === 'skipped').length;
  const totalError = rows.filter((r) => r.status === 'error').length;
  
  const selectableRows = rows.filter(r => r.status !== 'error' && r.status !== 'skipped'); // Skipped usually means duplicate in DB, maybe we don't select them? Or just warn.
  // Actually, if it's skipped (duplicate), we probably shouldn't import it again or just ignore it.
  // Let's assume 'skipped' means it exists. We might not want to re-import.
  
  const selectedCount = rows.filter(r => r.selected).length;
  const allSelected = selectableRows.length > 0 && selectedCount === selectableRows.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < selectableRows.length;

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="flex flex-wrap gap-3 items-center">
        <Badge variant="outline" className="text-sm px-3 py-1">
          Total: <span className="font-bold ml-1">{rows.length}</span>
        </Badge>
        <Badge variant={selectedCount > 0 ? "default" : "outline"} className="text-sm px-3 py-1">
          Dipilih: <span className="font-bold ml-1">{selectedCount}</span>
        </Badge>
        {totalOk > 0 && (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-sm px-3 py-1">
            <CheckCircle size={14} className="mr-1" />
            {totalOk} Baru
          </Badge>
        )}
        {totalSkipped > 0 && (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-sm px-3 py-1">
            <AlertTriangle size={14} className="mr-1" />
            {totalSkipped} Sudah Ada (Skip)
          </Badge>
        )}
        {totalError > 0 && (
            <Badge className="bg-red-500/10 text-red-500 border-red-500/30 text-sm px-3 py-1">
                <X size={14} className="mr-1" />
                {totalError} Error
            </Badge>
        )}
      </div>

      {/* Preview Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <ScrollArea className="h-[400px]">
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
                  Nama Praktikum
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  Tahun Ajaran
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isDisabled = row.status === 'error' || row.status === 'skipped';
                return (
                <tr
                  key={idx}
                  className={`
                    border-b border-border/50 transition-colors
                    ${row.status === 'error' ? 'bg-red-500/5' : ''}
                    ${row.status === 'skipped' ? 'bg-amber-500/5' : ''}
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
                  <td className="px-3 py-2 font-medium">
                    {row.nama}
                  </td>
                  <td className="px-3 py-2 text-center font-mono text-xs">
                    {row.tahun_ajaran}
                  </td>
                  <td className="px-3 py-2">
                    {row.status === 'ok' && (
                      <span className="inline-flex items-center gap-1 text-emerald-500 text-xs">
                        <CheckCircle size={14} /> Ready to Import
                      </span>
                    )}
                    {row.status === 'skipped' && (
                      <span className="inline-flex items-center gap-1 text-amber-500 text-xs">
                        <AlertTriangle size={14} /> {row.statusMessage || 'Sudah Ada'}
                      </span>
                    )}
                    {row.status === 'error' && (
                      <span className="inline-flex items-center gap-1 text-red-500 text-xs">
                        <X size={14} /> {row.statusMessage || 'Error'}
                      </span>
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </ScrollArea>
      </div>

      <div className="flex justify-between items-center pt-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
          <ArrowLeft size={16} className="mr-1" />
          Kembali
        </Button>

        <Button
            onClick={onConfirm}
            disabled={loading || selectedCount === 0}
            variant="default"
        >
            <Save size={16} className="mr-1" />
            {loading ? 'Menyimpan...' : `Simpan ${selectedCount} Data Terpilih`}
        </Button>
      </div>
    </div>
  );
}
