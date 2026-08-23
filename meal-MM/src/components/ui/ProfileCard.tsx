import { LogOut } from 'lucide-react';

interface ProfileCardProps {
  name?: string;
  email?: string;
  onSignOut: () => void;
}

export default function ProfileCard({ name, email, onSignOut }: ProfileCardProps) {
  return (
    <div className="px-3 py-4 border-t border-gray-100">
      <div className="flex items-center gap-3 px-3 py-2 mb-2">
        <div className="w-9 h-9 avatar-gradient rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-xs">{name?.charAt(0) ?? '?'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-900 truncate">{name}</div>
          {email && <div className="text-xs text-gray-500 truncate">{email}</div>}
        </div>
      </div>
      <button
        onClick={onSignOut}
        aria-label="Sign out"
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors duration-200 text-sm font-medium"
      >
        <LogOut className="w-4 h-4" aria-hidden="true" />
        Sign Out
      </button>
    </div>
  );
}
