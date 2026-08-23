import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger' | 'success' | 'warning';
}

const TONE_HOVER: Record<NonNullable<ActionButtonProps['tone']>, string> = {
  default: 'hover:text-blue-600 hover:bg-blue-50',
  danger: 'hover:text-red-600 hover:bg-red-50',
  success: 'hover:text-green-600 hover:bg-green-50',
  warning: 'hover:text-orange-600 hover:bg-orange-50',
};

export default function ActionButton({ icon: Icon, label, onClick, tone = 'default' }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`p-1.5 text-gray-400 rounded-lg transition-colors duration-150 ${TONE_HOVER[tone]}`}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}
