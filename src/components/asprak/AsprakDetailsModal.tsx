import { X } from 'lucide-react';
import { Asprak } from '@/types/database';
import { AsprakAssignment } from '@/lib/fetchers/asprakFetcher';
import { useMemo } from 'react';

interface AsprakWithAssignments extends Asprak {
  assignments?: AsprakAssignment[];
}

interface AsprakDetailsModalProps {
  asprak: AsprakWithAssignments;
  loading: boolean;
  onClose: () => void;
}

export default function AsprakDetailsModal({ asprak, loading, onClose }: AsprakDetailsModalProps) {
  const groupedAssignments = useMemo(() => {
    if (!asprak.assignments) return {};
    const groups: Record<string, string[]> = {};

    asprak.assignments.forEach((item: any) => {
      const term = item.praktikum?.tahun_ajaran || 'Unknown Term';
      if (!groups[term]) groups[term] = [];
      groups[term].push(item.praktikum?.nama);
    });

    return groups;
  }, [asprak.assignments]);

  const terms = Object.keys(groupedAssignments).sort().reverse();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card glass"
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={24} />
        </button>

        {/* Asprak Info */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'var(--primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 'bold',
            }}
          >
            {asprak.kode}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{asprak.nama_lengkap}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {asprak.nim} • Angkatan {asprak.angkatan}
          </p>
        </div>

        {/* Assignment History */}
        <h3
          style={{
            borderBottom: '1px solid var(--card-border)',
            paddingBottom: '0.5rem',
            marginBottom: '1rem',
            color: 'var(--primary)',
          }}
        >
          Assignment History
        </h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading assignments...</p>
        ) : terms.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No assignments found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {terms.map((term) => (
              <div key={term}>
                <h4
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Term {term}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {groupedAssignments[term].map((mk, idx) => (
                    <span
                      key={idx}
                      className="badge badge-blue"
                      style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}
                    >
                      {mk}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
