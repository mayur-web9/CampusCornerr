import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}

export default function Pagination({ page, totalPages, onPageChange, totalItems, pageSize }: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
      <p className="text-xs text-gray-500">
        Showing <span className="font-medium text-slate-700">{start}-{end}</span> of{' '}
        <span className="font-medium text-slate-700">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Previous page"
          className="btn-icon disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 px-2 whitespace-nowrap">Page {page} of {totalPages}</span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Next page"
          className="btn-icon disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
