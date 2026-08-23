import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-3">
      <div>
        {breadcrumb && <p className="text-xs font-medium text-gray-400 mb-1">{breadcrumb}</p>}
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
