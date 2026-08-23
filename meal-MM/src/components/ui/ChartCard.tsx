import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function ChartCard({ title, subtitle, actions, children }: ChartCardProps) {
  return (
    <div className="card card-hover">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
