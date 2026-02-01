import { Search } from 'lucide-react';

interface AsprakFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: 'active' | 'inactive' | 'all';
  onFilterChange: (status: 'active' | 'inactive' | 'all') => void;
}

export default function AsprakFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
}: AsprakFiltersProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid var(--card-border)',
        alignItems: 'center',
      }}
    >
      {/* Search Input */}
      <div style={{ position: 'relative', flex: 1 }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }}
        />
        <input
          type="text"
          placeholder="Search by Name, NIM, or Code..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem 0.75rem 2.75rem',
            borderRadius: 'var(--radius)',
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid var(--card-border)',
            color: 'white',
            outline: 'none',
          }}
        />
      </div>

      {/* Filter Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'rgba(0,0,0,0.2)',
          padding: '0.25rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--card-border)',
        }}
      >
        {(['active', 'inactive', 'all'] as const).map((status) => (
          <button
            key={status}
            onClick={() => onFilterChange(status)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: filterStatus === status ? 'var(--primary)' : 'transparent',
              color: filterStatus === status ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              textTransform: 'capitalize',
            }}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}
