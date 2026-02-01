import { useState } from 'react';
import { formatTerm } from '@/utils/term';
import { Button } from '@/components/ui/button';
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
import { Checkbox } from '@/components/ui/checkbox';

interface AsprakFormProps {
  existingCodes: string[];
  availablePraktikums: { id: string; nama: string }[];
  onSubmit: (data: AsprakFormData) => Promise<void>;
  onCancel: () => void;
}

export interface AsprakFormData {
  nim: string;
  nama_lengkap: string;
  kode: string;
  angkatan: number;
  term: string;
  praktikumNames: string[];
}

export default function AsprakForm({
  existingCodes,
  availablePraktikums,
  onSubmit,
  onCancel,
}: AsprakFormProps) {
  const [formData, setFormData] = useState({
    nim: '',
    nama_lengkap: '',
    kode: '',
    angkatan: new Date().getFullYear().toString(),
  });

  const [termYear, setTermYear] = useState('24');
  const [termSem, setTermSem] = useState<'1' | '2'>('2');
  const [selectedMkIds, setSelectedMkIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const term = formatTerm(termYear, termSem);

      await onSubmit({
        nim: formData.nim,
        nama_lengkap: formData.nama_lengkap,
        kode: formData.kode,
        angkatan: parseInt(formData.angkatan),
        term,
        praktikumNames: selectedMkIds,
      });

      setFormData({
        nim: '',
        nama_lengkap: '',
        kode: '',
        angkatan: new Date().getFullYear().toString(),
      });
      setSelectedMkIds([]);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
          <Input
            id="nama_lengkap"
            required
            type="text"
            value={formData.nama_lengkap}
            onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nim">NIM</Label>
            <Input
              id="nim"
              required
              type="text"
              value={formData.nim}
              onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kode">Kode (3 Huruf)</Label>
            <Input
              id="kode"
              required
              type="text"
              maxLength={3}
              list="code-suggestions"
              className="uppercase"
              value={formData.kode}
              onChange={(e) => setFormData({ ...formData, kode: e.target.value.toUpperCase() })}
            />
            <datalist id="code-suggestions">
              {existingCodes.map((code) => (
                <option key={code} value={code} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="angkatan">Angkatan</Label>
          <Input
            id="angkatan"
            required
            type="number"
            value={formData.angkatan}
            onChange={(e) => setFormData({ ...formData, angkatan: e.target.value })}
          />
        </div>

        <hr className="border-border my-4" />

        <div className="space-y-2">
          <Label>Tahun Ajaran Penugasan</Label>
          <div className="flex items-center gap-2">
            <Input
              required
              type="number"
              min="10"
              max="99"
              placeholder="YY"
              value={termYear}
              onChange={(e) => setTermYear(e.target.value)}
              className="w-20 text-center"
            />

            <span className="text-muted-foreground">/</span>

            <div className="w-20 px-3 py-2 bg-muted/30 rounded-md text-muted-foreground text-center text-sm">
              {termYear ? parseInt(termYear) + 1 : 'YY'}
            </div>

            <span className="text-muted-foreground">-</span>

            <Select value={termSem} onValueChange={(val) => setTermSem(val as '1' | '2')}>
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
            Format: {termYear}
            {parseInt(termYear) + 1}-{termSem} (e.g. 2425-2)
          </p>
        </div>

        <div className="space-y-2">
          <Label>Pilih Praktikum (Multi-select)</Label>
          <div className="max-h-[150px] overflow-y-auto border border-border rounded-md p-2 space-y-2">
            {availablePraktikums.map((p) => (
              <div key={p.id} className="flex items-center space-x-2">
                <Checkbox
                  id={p.id}
                  checked={selectedMkIds.includes(p.nama)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedMkIds([...selectedMkIds, p.nama]);
                    } else {
                      setSelectedMkIds(selectedMkIds.filter((id) => id !== p.nama));
                    }
                  }}
                />
                <label
                  htmlFor={p.id}
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {p.nama}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Simpan Data'}
        </Button>
      </div>
    </form>
  );
}
