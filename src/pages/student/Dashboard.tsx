import { useEffect, useState, useRef } from 'react';
import { Calendar, Clock, QrCode, Megaphone, CheckCircle, AlertCircle, XCircle, UtensilsCrossed } from 'lucide-react';
import QRCode from 'qrcode';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Subscription, Menu, Announcement } from '../../lib/types';
import { toast } from 'sonner';

function QRModal({ title, dataUrl, onClose }: { title: string; dataUrl: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-900 text-lg mb-1">{title} QR Pass</h3>
        <p className="text-sm text-gray-500 mb-4">Show this to the mess staff</p>
        <img src={dataUrl} alt="QR Code" className="w-48 h-48 mx-auto rounded-xl border border-gray-100" />
        <button onClick={onClose} className="mt-4 btn-primary w-full py-2.5">Close</button>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<{ type: string; dataUrl: string } | null>(null);
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  async function loadData() {
    const today = new Date().toISOString().split('T')[0];

    const [subRes, menuRes, annRes] = await Promise.all([
      supabase.from('subscriptions').select('*, plan:meal_plans(*)').eq('student_id', (profile as any).id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('menus').select('*').eq('meal_date', today).maybeSingle(),
      supabase.from('announcements').select('*').eq('active', true).order('created_at', { ascending: false }).limit(5),
    ]);

    const sub = subRes.data;
    setSubscription(sub);
    setMenu(menuRes.data);
    setAnnouncements(annRes.data ?? []);

    // Generate QR codes
    if (sub && (profile as any)?.id) {
      const types = ['breakfast', 'lunch', 'dinner'];
      const urls: Record<string, string> = {};
      for (const type of types) {
        const payload = JSON.stringify({ studentId: (profile as any).id, mealType: type, timestamp: Date.now() });
        urls[type] = await QRCode.toDataURL(payload, { width: 256, margin: 2, color: { dark: '#111', light: '#fff' } });
      }
      setQrUrls(urls);
    }

    // Subscription notifications
    if (sub && !notifiedRef.current) {
      notifiedRef.current = true;
      const endDate = new Date(sub.end_date);
      const now = new Date();
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (sub.status === 'expired' || daysRemaining < 0) {
        toast.error('Your subscription has expired. Please renew.');
      } else if (daysRemaining <= 5) {
        toast.warning(`Subscription expiring soon! ${daysRemaining} day(s) remaining.`);
      } else {
        toast.success(`Subscription active. ${daysRemaining} days remaining.`);
      }
    }

    setLoading(false);
  }

  function getDaysRemaining() {
    if (!subscription) return 0;
    const end = new Date(subscription.end_date);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  function isActive() {
    if (!subscription) return false;
    const end = new Date(subscription.end_date);
    const start = new Date(subscription.start_date);
    const now = new Date();
    return now >= start && now <= end && subscription.status === 'active';
  }

  const daysLeft = getDaysRemaining();
  const active = isActive();

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 bg-gray-200 rounded-xl" />
        <div className="h-40 bg-gray-200 rounded-xl" />
        <div className="h-32 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', icon: '☀️', time: '08:00 AM – 10:00 AM', menu: menu?.breakfast },
    { key: 'lunch', label: 'Lunch', icon: '🌤️', time: '01:00 PM – 03:00 PM', menu: menu?.lunch },
    { key: 'dinner', label: 'Dinner', icon: '🌙', time: '08:00 PM – 10:00 PM', menu: menu?.dinner },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hello, {profile?.full_name?.split(' ')[0]}</h1>
        <p className="text-gray-500 text-sm mt-1">Here's your meal dashboard for today</p>
      </div>

      {/* Subscription Card */}
      <div className={`rounded-2xl p-6 text-white shadow-lg ${active ? 'bg-gradient-to-br from-red-600 to-red-700' : 'bg-gradient-to-br from-gray-600 to-gray-700'}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm font-medium">Current Plan</p>
            <h2 className="text-xl font-bold mt-1">{(subscription?.plan as any)?.plan_name ?? 'No Plan'}</h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${active ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70'}`}>
            {active ? 'Active' : 'Expired'}
          </span>
        </div>

        {subscription ? (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-white/60 text-xs">Start Date</p>
              <p className="text-sm font-medium mt-0.5">{new Date(subscription.start_date).toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">End Date</p>
              <p className="text-sm font-medium mt-0.5">{new Date(subscription.end_date).toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Days Left</p>
              <p className="text-sm font-semibold mt-0.5">{daysLeft}</p>
            </div>
          </div>
        ) : (
          <p className="text-white/70 text-sm mt-2">No active subscription. Contact admin.</p>
        )}
      </div>

      {/* Today's Menu */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Today's Menu</h2>
            <p className="text-xs text-gray-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        {menu ? (
          <div className="space-y-3">
            {[{ label: 'Breakfast', value: menu.breakfast }, { label: 'Lunch', value: menu.lunch }, { label: 'Dinner', value: menu.dinner }].map(item => (
              <div key={item.label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                  <p className="text-gray-500 text-sm">{item.value || 'Not set'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Menu not set for today</p>
          </div>
        )}
      </div>

      {/* Meal QR Passes */}
      {active && Object.keys(qrUrls).length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-1">Meal QR Passes</h2>
          <p className="text-sm text-gray-500 mb-4">Show QR code to mess staff to get your meal</p>
          <div className="grid grid-cols-3 gap-3">
            {mealTypes.map(meal => (
              <button
                key={meal.key}
                onClick={() => setQrModal({ type: meal.label, dataUrl: qrUrls[meal.key] })}
                className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-colors group"
              >
                <div className="text-2xl">{meal.icon}</div>
                <span className="text-xs font-semibold text-red-700">{meal.label}</span>
                <QrCode className="w-4 h-4 text-red-600 opacity-70 group-hover:opacity-100" />
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">Tap to view full QR code</p>
        </div>
      )}

      {/* Meal Times */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">Meal Times</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {mealTypes.map(meal => (
            <div key={meal.key} className="p-4 bg-gray-50 rounded-xl text-center">
              <div className="text-2xl mb-2">{meal.icon}</div>
              <p className="font-semibold text-gray-900 text-sm">{meal.label}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                {meal.time}
              </p>
              {meal.menu && <p className="text-xs text-red-600 mt-2 font-medium truncate">{meal.menu}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-5 h-5 text-red-600" />
            <h2 className="font-bold text-gray-900">Announcements</h2>
          </div>
          <div className="space-y-3">
            {announcements.map(ann => (
              <div key={ann.id} className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm">{ann.title}</h3>
                  <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">Active</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{ann.description}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(ann.created_at).toLocaleDateString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <QRModal
          title={qrModal.type}
          dataUrl={qrModal.dataUrl}
          onClose={() => setQrModal(null)}
        />
      )}
    </div>
  );
}
