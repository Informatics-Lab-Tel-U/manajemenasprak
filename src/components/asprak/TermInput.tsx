/**
 * TermInput — Reusable academic term input component
 *
 * Used in both the Add Manual modal and Import CSV modal.
 * Renders: [YY] / [YY+1 (auto)] - [Semester dropdown]
 *
 * @module components/asprak/TermInput
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TermInputProps {
  termYear: string;
  termSem: '1' | '2';
  onYearChange: (year: string) => void;
  onSemChange: (sem: '1' | '2') => void;
  label?: string;
  description?: string;
}

export default function TermInput({
  termYear,
  termSem,
  onYearChange,
  onSemChange,
  label = 'Tahun Ajaran',
  description,
}: TermInputProps) {
  const parsedYear = parseInt(termYear);
  const endYear = !isNaN(parsedYear) ? parsedYear + 1 : 'YY';
  const termStr = !isNaN(parsedYear) ? `${termYear}${endYear}-${termSem}` : '';

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          required
          type="number"
          min="10"
          max="99"
          placeholder="YY"
          value={termYear}
          onChange={(e) => onYearChange(e.target.value)}
          className="w-20 text-center"
        />

        <span className="text-muted-foreground">/</span>

        <div className="w-20 px-3 py-2 bg-muted/30 rounded-md text-muted-foreground text-center text-sm">
          {endYear}
        </div>

        <span className="text-muted-foreground">-</span>

        <Select value={termSem} onValueChange={(val) => onSemChange(val as '1' | '2')}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="1">1 (Ganjil)</SelectItem>
              <SelectItem value="2">2 (Genap)</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {description || (termStr ? `Format: ${termStr} (e.g. 2425-2)` : 'Masukkan tahun ajaran')}
      </p>
    </div>
  );
}

/**
 * Build a term string from year + semester values.
 * @example buildTermString('24', '2') => '2425-2'
 */
export function buildTermString(year: string, sem: '1' | '2'): string {
  const y = parseInt(year);
  if (isNaN(y)) return '';
  return `${y}${y + 1}-${sem}`;
}
