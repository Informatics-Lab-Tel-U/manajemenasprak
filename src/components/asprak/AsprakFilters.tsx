import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AsprakFiltersProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  terms: string[];
  selectedTerm: string;
  onTermChange: (term: string) => void;
  hideSearch?: boolean;
}

export default function AsprakFilters({
  searchQuery,
  onSearchChange,
  terms,
  selectedTerm,
  onTermChange,
  hideSearch = false,
}: AsprakFiltersProps) {
  return (
    <div className={`flex flex-col sm:flex-row gap-4 pb-6 border-b border-border items-center ${hideSearch ? 'justify-end' : ''}`}>
      {!hideSearch && (
        <div className="relative flex-1 w-full">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      <div className={`w-full sm:w-auto ${hideSearch ? 'ml-auto' : ''}`}>
        <Select value={selectedTerm} onValueChange={onTermChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select term" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Terms</SelectItem>
              {terms.map((term) => (
                <SelectItem key={term} value={term}>
                  {term}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
