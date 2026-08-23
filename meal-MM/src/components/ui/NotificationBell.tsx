import { Bell } from 'lucide-react';

interface NotificationBellProps {
  count?: number;
  onClick?: () => void;
}

export default function NotificationBell({ count = 0, onClick }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      aria-label={count > 0 ? `${count} unread notifications` : 'Notifications'}
      className="relative p-2 text-gray-500 hover:text-slate-700 hover:bg-gray-100 rounded-xl transition-colors duration-200"
    >
      <Bell className="w-5 h-5" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" aria-hidden="true" />
      )}
    </button>
  );
}
