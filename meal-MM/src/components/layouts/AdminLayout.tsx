import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  UserCheck,
  UtensilsCrossed,
  Megaphone,
  Vote,
  Receipt,
  TicketPercent,
  Settings,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import Logo from '../ui/Logo';
import ProfileCard from '../ui/ProfileCard';
import NotificationBell from '../ui/NotificationBell';
import SearchBar from '../ui/SearchBar';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { to: '/admin/staff', icon: UserCheck, label: 'Staff' },
  { to: '/admin/menus', icon: UtensilsCrossed, label: 'Menus' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/polls', icon: Vote, label: 'Polls' },
  { to: '/admin/tickets', icon: MessageSquare, label: 'Support' },
  { to: '/admin/payments', icon: Receipt, label: 'Payments' },
  { to: '/admin/coupons', icon: TicketPercent, label: 'Coupons' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

function useActivePage() {
  const location = useLocation();
  const sorted = [...navItems].sort((a, b) => b.to.length - a.to.length);
  const match = sorted.find(item => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
  return match?.label ?? 'Overview';
}

const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickNav, setQuickNav] = useState('');
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const activePage = useActivePage();

  async function handleSignOut() {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/login');
  }

  function handleQuickNav(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    const match = navItems.find(item => item.label.toLowerCase().includes(quickNav.trim().toLowerCase()));
    if (match) {
      navigate(match.to);
      setQuickNav('');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-[260px] bg-white border-r border-gray-100 z-30 flex flex-col
          transition-transform duration-300 lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <Logo subtitle="Admin Panel" size={56} to="/admin/dashboard" />
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-gray-600"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => (isActive ? 'sidebar-link-active' : 'sidebar-link')}
            >
              <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <ProfileCard name={profile?.full_name} email={profile?.email} onSignOut={handleSignOut} />
      </aside>

      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 h-[72px] px-4 md:px-6 flex items-center gap-4">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <p className="text-xs text-gray-400 hidden sm:block">Admin / {activePage}</p>
            <h1 className="text-base font-bold text-slate-900 truncate">{activePage}</h1>
          </div>

          <div className="flex-1" />

          <SearchBar
            value={quickNav}
            onChange={setQuickNav}
            onKeyDown={handleQuickNav}
            placeholder="Jump to..."
            className="hidden md:block w-56"
          />

          <NotificationBell onClick={() => toast.info('No new notifications')} />

          <span className="hidden lg:block text-xs text-gray-400 whitespace-nowrap">{today}</span>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-100">
            <div className="w-8 h-8 avatar-gradient rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-xs">{profile?.full_name?.charAt(0) ?? 'A'}</span>
            </div>
            <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
              {profile?.full_name?.split(' ')[0] ?? 'Admin'}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
