import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface AsprakFiltersProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  hideSearch?: boolean;
}

export default function AsprakFilters({
  searchQuery,
  onSearchChange,
  hideSearch = false,
}: AsprakFiltersProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 border-border items-center ${hideSearch ? 'justify-end' : ''}`}
    >
      {!hideSearch && (
        <div className="relative flex-1 w-full">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            placeholder="Cari..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10"
          />
        </div>
      )}
    </div>
  );
}
