
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

interface PlottingFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  terms: string[];
  selectedTerm: string;
  onTermChange: (term: string) => void;
  praktikums: { id: string; nama: string }[];
  selectedPraktikum: string;
  onPraktikumChange: (id: string) => void;
}

export default function PlottingFilters({
  searchQuery,
  onSearchChange,
  terms,
  selectedTerm,
  onTermChange,
  praktikums,
  selectedPraktikum,
  onPraktikumChange,
}: PlottingFiltersProps) {
  return (
    <div className="flex flex-col gap-4 pb-6 border-b border-border">
       <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
                type="text"
                placeholder="Search asprak, code, or course..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-10"
            />
          </div>
          
          <div className="flex gap-2">
              {/* Term Filter */}
              <Select value={selectedTerm} onValueChange={onTermChange}>
                <SelectTrigger className="w-[160px] h-10">
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
              
              {/* Praktikum Filter */}
              <Select value={selectedPraktikum} onValueChange={onPraktikumChange}>
                <SelectTrigger className="w-[200px] h-10">
                    <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                    <SelectItem value="all">All Courses</SelectItem>
                    {praktikums.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                        {p.nama}
                        </SelectItem>
                    ))}
                    </SelectGroup>
                </SelectContent>
              </Select>
          </div>
       </div>
    </div>
  );
}
