export type BadgeTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

const TONE_CLASS: Record<BadgeTone, string> = {
  success: 'badge-active',
  danger: 'badge-expired',
  warning: 'badge-pending',
  info: 'badge-info',
  neutral: 'badge-neutral',
};

const STATUS_TONE: Record<string, BadgeTone> = {
  active: 'success',
  open: 'success',
  enabled: 'success',
  paid: 'success',
  resolved: 'info',
  closed: 'neutral',
  draft: 'neutral',
  'in progress': 'warning',
  pending: 'warning',
  expired: 'danger',
  disabled: 'neutral',
  inactive: 'neutral',
  failed: 'danger',
  cancelled: 'danger',
};

interface StatusBadgeProps {
  status: string;
  tone?: BadgeTone;
  className?: string;
}

export default function StatusBadge({ status, tone, className = '' }: StatusBadgeProps) {
  const resolvedTone = tone ?? STATUS_TONE[status.toLowerCase()] ?? 'neutral';

  return (
    <span className={`${TONE_CLASS[resolvedTone]} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {status}
    </span>
  );
}
