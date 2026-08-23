import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  hover?: boolean;
}

export default function StatCard({ label, value, icon: Icon, iconBg = 'bg-red-50', iconColor = 'text-red-600', hover = true }: StatCardProps) {
  return (
    <div className={`card ${hover ? 'card-hover' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-gray-500 text-xs font-medium truncate">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 truncate">{value}</p>
        </div>
        <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
