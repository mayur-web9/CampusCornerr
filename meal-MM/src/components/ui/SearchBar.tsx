import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function SearchBar({ value, onChange, placeholder = 'Search...', className = '', onKeyDown }: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        aria-label={placeholder}
        className="input-field pl-10"
      />
    </div>
  );
}
