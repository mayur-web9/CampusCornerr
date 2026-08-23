import { ReactNode } from 'react';
import SearchBar from './SearchBar';

interface FilterOption<T extends string> {
  value: T;
  label: string;
}

interface TableToolbarProps<T extends string> {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption<T>[];
  activeFilter?: T;
  onFilterChange?: (value: T) => void;
  children?: ReactNode;
}

export default function TableToolbar<T extends string>({
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  activeFilter,
  onFilterChange,
  children,
}: TableToolbarProps<T>) {
  return (
    <div className="card flex flex-col sm:flex-row gap-3">
      <SearchBar value={search} onChange={onSearchChange} placeholder={searchPlaceholder} className="flex-1" />
      {filters && filters.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => onFilterChange?.(f.value)}
              aria-pressed={activeFilter === f.value}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
                activeFilter === f.value
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
