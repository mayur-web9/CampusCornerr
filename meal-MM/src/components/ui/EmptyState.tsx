import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-gray-300" aria-hidden="true" />
      </div>
      <p className="font-semibold text-slate-900 text-sm">{title}</p>
      {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
