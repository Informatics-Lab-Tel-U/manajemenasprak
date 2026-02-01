import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    <div className="flex gap-4 pb-6 border-b border-border items-center">
      <div className="relative flex-1">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          placeholder="Search by Name, NIM, or Code..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs
        value={filterStatus}
        onValueChange={(val) => onFilterChange(val as 'active' | 'inactive' | 'all')}
      >
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
