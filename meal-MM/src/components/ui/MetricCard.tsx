import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  trend?: { value: number; label?: string };
}

export default function MetricCard({ label, value, icon: Icon, iconBg = 'bg-red-50', iconColor = 'text-red-600', trend }: MetricCardProps) {
  const positive = (trend?.value ?? 0) >= 0;

  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-gray-500 text-xs font-medium truncate">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 truncate">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${positive ? 'text-green-600' : 'text-red-600'}`}>
              {positive ? <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" /> : <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />}
              {Math.abs(trend.value)}% {trend.label}
            </div>
          )}
        </div>
        <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
