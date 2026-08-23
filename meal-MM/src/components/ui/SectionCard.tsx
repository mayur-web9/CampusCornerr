import { ReactNode } from 'react';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  padded?: boolean;
  className?: string;
}

export default function SectionCard({ title, subtitle, actions, children, padded = true, className = '' }: SectionCardProps) {
  return (
    <div className={`card ${!padded ? 'p-0 overflow-hidden' : ''} ${className}`}>
      {(title || actions) && (
        <div className={`flex items-center justify-between gap-3 ${padded ? 'mb-4' : 'p-6 pb-0'}`}>
          <div>
            {title && <h2 className="font-bold text-slate-900">{title}</h2>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
