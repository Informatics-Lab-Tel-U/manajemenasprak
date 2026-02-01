import { useState } from 'react';
import { formatTerm } from '@/utils/term';

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
      <div style={{ display: 'grid', gap: '1rem' }}>
        {/* Nama Lengkap */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Nama Lengkap
          </label>
          <input
            required
            type="text"
            className="input-field"
            value={formData.nama_lengkap}
            onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius)',
              color: 'white',
            }}
          />
        </div>

        {/* NIM and Kode */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              NIM
            </label>
            <input
              required
              type="text"
              className="input-field"
              value={formData.nim}
              onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius)',
                color: 'white',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
              Kode (3 Huruf)
            </label>
            <input
              required
              type="text"
              maxLength={3}
              list="code-suggestions"
              style={{
                textTransform: 'uppercase',
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius)',
                color: 'white',
              }}
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

        {/* Angkatan */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Angkatan
          </label>
          <input
            required
            type="number"
            className="input-field"
            value={formData.angkatan}
            onChange={(e) => setFormData({ ...formData, angkatan: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius)',
              color: 'white',
            }}
          />
        </div>

        <hr style={{ borderColor: 'var(--card-border)', margin: '1rem 0' }} />

        {/* Tahun Ajaran */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Tahun Ajaran Penugasan
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ position: 'relative', width: '80px' }}>
              <input
                required
                type="number"
                min="10"
                max="99"
                placeholder="YY"
                value={termYear}
                onChange={(e) => setTermYear(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 'var(--radius)',
                  color: 'white',
                  textAlign: 'center',
                }}
              />
            </div>

            <span style={{ color: 'var(--text-muted)' }}>/</span>

            <div
              style={{
                width: '80px',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              {termYear ? parseInt(termYear) + 1 : 'YY'}
            </div>

            <span style={{ color: 'var(--text-muted)' }}>-</span>

            <select
              value={termSem}
              onChange={(e) => setTermSem(e.target.value as '1' | '2')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius)',
                color: 'white',
              }}
            >
              <option value="1">1 (Ganjil)</option>
              <option value="2">2 (Genap)</option>
            </select>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Format: {termYear}
            {parseInt(termYear) + 1}-{termSem} (e.g. 2425-2)
          </p>
        </div>

        {/* Praktikum Selection */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Pilih Praktikum (Multi-select)
          </label>
          <div
            style={{
              maxHeight: '150px',
              overflowY: 'auto',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius)',
              padding: '0.5rem',
            }}
          >
            {availablePraktikums.map((p) => (
              <label
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedMkIds.includes(p.nama)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMkIds([...selectedMkIds, p.nama]);
                    } else {
                      setSelectedMkIds(selectedMkIds.filter((id) => id !== p.nama));
                    }
                  }}
                />
                {p.nama}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Simpan Data'}
        </button>
      </div>
    </form>
  );
}
