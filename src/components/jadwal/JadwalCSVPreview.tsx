import { AlertTriangle, ArrowLeft, CheckCircle, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { CreateJadwalInput } from '@/services/jadwalService';

export interface JadwalPreviewRow extends CreateJadwalInput {
  status: 'ok' | 'error' | 'warning';
  statusMessage: string;
  mkName: string; // Original MK name from CSV or derived for display
  fromSystemLogic: boolean; // Tells UI if mkName was auto-matched
  selected: boolean;
  originalRow?: number;
}

interface JadwalCSVPreviewProps {
  rows: JadwalPreviewRow[];
  onConfirm: () => void;
  onBack: () => void;
  onToggleSelect: (index: number) => void;
  onToggleAll: (checked: boolean) => void;
  loading: boolean;
  onSkip?: () => void;
}

export default function JadwalCSVPreview({
  rows,
  onConfirm,
  onBack,
  onToggleSelect,
  onToggleAll,
  loading,
  onSkip,
}: JadwalCSVPreviewProps) {
  // ─── Stats for Preview ───────────────────────────────────────────────────
  const totalOk = rows.filter((r) => r.status === 'ok').length;
  const totalWarning = rows.filter((r) => r.status === 'warning').length;
  const totalError = rows.filter((r) => r.status === 'error').length;

  const selectableRows = rows.filter((r) => r.status === 'ok' || r.status === 'warning');
  const selectedCount = selectableRows.filter((r) => r.selected).length;
  const allSelected = selectableRows.length > 0 && selectedCount === selectableRows.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < selectableRows.length;

  return (
    <div className="space-y-4">
      {/* Summary Badges using Asprak Preview style */}
      <div className="flex flex-wrap gap-3 items-center">
        <Badge variant="outline" className="text-sm px-3 py-1">
          Total: <span className="font-bold ml-1">{rows.length}</span>
        </Badge>
        <Badge
          variant={selectedCount > 0 ? 'default' : 'outline'}
          className="text-sm px-3 py-1 transition-colors"
        >
          Dipilih: <span className="font-bold ml-1">{selectedCount}</span>
        </Badge>
        {totalOk > 0 && (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-sm px-3 py-1">
            <CheckCircle size={14} className="mr-1" />
            {totalOk} OK
          </Badge>
        )}
        {totalError > 0 && (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/30 text-sm px-3 py-1">
            <AlertTriangle size={14} className="mr-1" />
            {totalError} Error
          </Badge>
        )}
        {totalWarning > 0 && (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30 text-sm px-3 py-1">
            <AlertTriangle size={14} className="mr-1" />
            {totalWarning} Warning
          </Badge>
        )}
      </div>

      {/* Table Component */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2.5 text-center border-b border-border w-[40px]">
                  <Checkbox
                    checked={
                      allSelected ? true : isIndeterminate ? 'indeterminate' : false
                    }
                    onCheckedChange={(checked) => onToggleAll(!!checked)}
                    disabled={selectableRows.length === 0}
                  />
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border w-[50px]">
                  No
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  Mata Kuliah
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  Kelas
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  Data Waktu
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  Ruangan
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  Dosen
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isDisabled = row.status === 'error';
                return (
                  <tr
                    key={idx}
                    className={cn(
                      'border-b border-border/50 transition-colors hover:bg-muted/60',
                      row.status === 'error' ? 'bg-red-500/5' : '',
                      row.status === 'warning' ? 'bg-amber-500/5' : '',
                      !isDisabled && row.selected ? 'bg-muted/40' : ''
                    )}
                  >
                    <td className="px-3 py-2 text-center">
                      <Checkbox
                        checked={row.selected}
                        onCheckedChange={() => onToggleSelect(idx)}
                        disabled={isDisabled}
                        className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                      />
                    </td>
                    <td className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">
                      {row.originalRow}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{row.mkName}</span>
                        {row.fromSystemLogic && (
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 px-1 py-0 shadow-none border-primary/20 text-primary"
                          >
                            Auto-Match
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60 font-mono hidden sm:block">
                        ID: {row.id_mk || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-2">{row.kelas}</td>
                    <td className="px-3 py-2">
                      <div>
                        {row.hari}, {row.jam}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60">
                        Sesi {row.sesi}
                      </div>
                    </td>
                    <td className="px-3 py-2">{row.ruangan}</td>
                    <td className="px-3 py-2 truncate max-w-[150px]" title={row.dosen}>
                      {row.dosen}
                    </td>
                    <td className="px-3 py-2">
                      {row.status === 'ok' && (
                        <span className="inline-flex items-center gap-1 text-emerald-500 text-xs font-medium">
                          <CheckCircle size={14} /> OK
                        </span>
                      )}
                      {row.status === 'warning' && (
                        <span
                          className="inline-flex items-center gap-1 text-amber-500 text-xs font-medium"
                          title={row.statusMessage}
                        >
                          <AlertTriangle size={14} /> {row.statusMessage}
                        </span>
                      )}
                      {row.status === 'error' && (
                        <span
                          className="inline-flex items-center gap-1 text-red-500 text-xs font-medium"
                          title={row.statusMessage}
                        >
                          <AlertTriangle size={14} /> {row.statusMessage}
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
          {totalError > 0 && (
            <p className="text-xs text-amber-500">
              {totalError} row(s) bermasalah akan di-skip.
            </p>
          )}
          {onSkip && (
              <Button type="button" variant="secondary" onClick={onSkip} disabled={loading}>
                 Lewati Langkah Ini
              </Button>
          )}
          <Button
            onClick={onConfirm}
            disabled={loading || selectedCount === 0}
            variant="default"
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <Save size={16} className="mr-1" />
            )}
            {loading ? 'Menyimpan...' : `Simpan ${selectedCount} Data Terpilih`}
          </Button>
        </div>
      </div>
    </div>
  );
}
