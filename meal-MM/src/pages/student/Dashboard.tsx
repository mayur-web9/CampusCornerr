import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, QrCode, UtensilsCrossed, Sunrise, Sun, Moon } from 'lucide-react';
import QRCode from 'qrcode';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Subscription, Menu, Announcement } from '../../lib/types';
import { toast } from 'sonner';
import Modal from '../../components/ui/Modal';
import SectionCard from '../../components/ui/SectionCard';
import EmptyState from '../../components/ui/EmptyState';

function QRModal({ title, dataUrl, studentCode, onClose }: { title: string; dataUrl: string; studentCode?: string; onClose: () => void }) {
  return (
    <Modal open onClose={onClose} maxWidth="max-w-xs">
      <div className="text-center">
        <h3 className="font-bold text-slate-900 text-lg mb-1">{title} QR Pass</h3>
        <p className="text-sm text-gray-500 mb-4">Show this to the mess staff</p>
        <img src={dataUrl} alt="QR Code" className="w-48 h-48 mx-auto rounded-xl border border-gray-100" />

        {studentCode && (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Manual Fallback Code</p>
            <p className="font-mono font-bold text-lg text-slate-900 tracking-wider">{studentCode}</p>
          </div>
        )}

        <button onClick={onClose} className="mt-4 btn-primary w-full py-2.5">Close</button>
      </div>
    </Modal>
  );
}

export default function StudentDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<{ type: string; dataUrl: string; fallbackCode: string } | null>(null);
  const [generatingQr, setGeneratingQr] = useState<string | null>(null);
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  async function loadData() {
    const today = new Date().toISOString().split('T')[0];

    const [subRes, menuRes, annRes] = await Promise.all([
      supabase.from('subscriptions').select('*, plan:meal_plans(*), meal_variant:meal_variants(*)').eq('student_id', (profile as any).id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('menus').select('*').eq('meal_date', today).maybeSingle(),
      supabase.from('announcements').select('*').eq('active', true).order('created_at', { ascending: false }).limit(5),
    ]);

    const sub = subRes.data;
    setSubscription(sub);
    setMenu(menuRes.data);
    setAnnouncements(annRes.data ?? []);

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

  async function handleShowQr(mealLabel: string, mealKey: string) {
    if (!profile) return;

    if ((subscription?.plan as any)?.[mealKey] !== true) {
      toast.error('This meal is not included in your subscription.');
      return;
    }

    setGeneratingQr(mealKey);

    const studentId = (profile as any).id;
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `hpro_qr_${studentId}_${mealKey}_${today}`;

    try {
      // Check if a token already exists for this meal today
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { fallbackCode, dataUrl } = JSON.parse(cached);
        setQrModal({ type: mealLabel, dataUrl, fallbackCode });
        return;
      }

      // First time today for this meal — generate a fresh unique code
      const random12 = Math.floor(100000000000 + Math.random() * 900000000000).toString();

      // Save to DB with meal type prefix so scanner can enforce meal-type restrictions
      // Format: "mealType:code" e.g. "breakfast:454302190366"
      await supabase.from('students').update({ qr_code: `${mealKey}:${random12}` }).eq('id', studentId);

      // Generate QR image
      const payload = JSON.stringify({ studentId, mealType: mealKey, date: today });
      const dataUrl = await QRCode.toDataURL(payload, { width: 256, margin: 2, color: { dark: '#111', light: '#fff' } });

      // Persist in localStorage so subsequent taps reuse the same code
      localStorage.setItem(cacheKey, JSON.stringify({ fallbackCode: random12, dataUrl }));

      setQrModal({ type: mealLabel, dataUrl, fallbackCode: random12 });
    } catch {
      toast.error('Failed to generate QR code');
    } finally {
      setGeneratingQr(null);
    }
  }

  const daysLeft = getDaysRemaining();
  const active = isActive();

  // ── Presentation-only derived values (UX layer) ──────────────────
  // Phase is purely for display; access control still lives in Scanner.tsx
  // and isActive()/getDaysRemaining() above, which remain untouched.
  const graceEndRaw = subscription?.grace_end_date ? new Date(subscription.grace_end_date) : null;
  const isInGrace = !!subscription && !active && subscription.status !== 'cancelled' && !!graceEndRaw && graceEndRaw >= new Date();
  const subscriptionPhase: 'active' | 'grace' | 'expired' | 'none' = !subscription ? 'none' : active ? 'active' : isInGrace ? 'grace' : 'expired';

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', icon: Sunrise, time: '07:30 AM – 10:30 AM', startHour: 1, endHour: 24, menu: menu?.breakfast },
    { key: 'lunch', label: 'Lunch', icon: Sun, time: '11:30 PM – 02:30 PM', startHour: 1, endHour: 24, menu: menu?.lunch },
    { key: 'dinner', label: 'Dinner', icon: Moon, time: '07:30 PM – 09:30 PM', startHour: 1, endHour: 24, menu: menu?.dinner },
  ];

  const availableMeals = subscription
    ? mealTypes.filter(meal => (subscription?.plan as any)?.[meal.key] === true)
    : [];

  function isMealActive(startHour: number, endHour: number) {
    const hour = new Date().getHours();
    return hour >= startHour && hour < endHour;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hello, {profile?.full_name?.split(' ')[0]}</h1>
        <p className="text-gray-500 text-sm mt-1">Here's your meal dashboard for today</p>
      </div>

      {/* Subscription Card */}
      {subscriptionPhase === 'none' ? (
        <div className="animate-fade-in rounded-[20px] px-6 py-8 sm:px-8 sm:py-10 bg-[#FFFBF7] border border-slate-100 shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight tracking-tight">
            Choose Your
            <br />
            Meal Plan
          </h2>

          <p className="text-gray-500 text-sm sm:text-base leading-relaxed mt-4 max-w-md">
            Start your Campus Corner journey by activating your meal subscription.
          </p>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed mt-2 max-w-md">
            Enjoy fresh meals every day with quick QR-based access across breakfast, lunch and dinner.
          </p>

          <div className="flex flex-wrap gap-2 mt-6">
            {['Breakfast', 'Lunch', 'Dinner'].map(item => (
              <span
                key={item}
                className="px-4 py-1.5 rounded-full text-sm font-medium text-slate-700 bg-white border border-slate-200"
              >
                {item}
              </span>
            ))}
          </div>

          <button
            onClick={() => navigate('/student/subscription')}
            className="w-full sm:w-[95%] mt-8 h-[48px] rounded-2xl bg-red-600 text-white font-semibold text-base shadow-sm hover:bg-red-700 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all duration-200"
          >
            Choose Your Plan
          </button>

          <p className="text-xs text-gray-400 mt-4">
            Already subscribed? You can view, renew or upgrade your meal plan anytime from the Subscription page.
          </p>
        </div>
      ) : (
        <div
          className={`animate-fade-in rounded-[20px] p-6 sm:p-7 text-white shadow-lg transition-all duration-200 ${
            subscriptionPhase === 'active'
              ? 'bg-gradient-to-br from-red-600 to-red-700 shadow-red-600/20'
              : subscriptionPhase === 'grace'
              ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/20'
              : 'bg-gradient-to-br from-slate-600 to-slate-700'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm font-medium">Current Plan</p>
              <h2 className="text-xl font-bold mt-1">{(subscription?.plan as any)?.plan_name ?? 'No Plan'}</h2>
              {subscription?.meal_variant && (
                <p className="text-white/80 text-sm mt-0.5">{subscription.meal_variant.variant_name}</p>
              )}
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
              {subscriptionPhase === 'active' ? 'Active' : subscriptionPhase === 'grace' ? 'Grace Period' : 'Expired'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-white/60 text-xs">Start Date</p>
              <p className="text-sm font-medium mt-0.5">{new Date(subscription!.start_date).toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">End Date</p>
              <p className="text-sm font-medium mt-0.5">{new Date(subscription!.end_date).toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Days Left</p>
              <p className="text-sm font-semibold mt-0.5">{daysLeft}</p>
            </div>
          </div>

          {subscriptionPhase === 'grace' && (
            <div className="mt-4 bg-white/10 rounded-xl px-3 py-2.5">
              <p className="text-white text-sm font-semibold">Grace Period Active</p>
              <p className="text-white/70 text-xs mt-0.5">Unused meals can still be redeemed.</p>
            </div>
          )}

          {subscriptionPhase === 'expired' && (
            <div className="mt-4 bg-white/10 rounded-xl px-3 py-2.5">
              <p className="text-white text-sm font-semibold">Subscription Expired</p>
              <p className="text-white/70 text-xs mt-0.5">Renew now to continue enjoying your meals.</p>
            </div>
          )}

          <button
            onClick={() => navigate('/student/subscription')}
            className={`mt-4 w-full h-[46px] rounded-2xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 ${
              subscriptionPhase === 'active' ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-slate-900 hover:bg-white/90'
            }`}
          >
            {subscriptionPhase === 'active' ? 'View Subscription' : 'Renew Subscription'}
          </button>
        </div>
      )}

      {/* Today's Menu */}
      <SectionCard
        title="Today's Menu"
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      >
        {menu ? (
          <div className="space-y-3">
            {[{ label: 'Breakfast', value: menu.breakfast }, { label: 'Lunch', value: menu.lunch }, { label: 'Dinner', value: menu.dinner }].map(item => (
              <div key={item.label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
                  <p className="text-gray-500 text-sm">{item.value || 'Not set'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={UtensilsCrossed} title="Menu not set for today" />
        )}
      </SectionCard>

      {/* Today's QR Passes — unified times + QR */}
      {subscription && (
        <SectionCard
          title="Today's QR Passes"
          subtitle="Only meals included in your subscription are shown. QR codes become available during meal timings."
        >
          {availableMeals.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="No meals available in your current subscription."
              description="Please contact your hostel administrator."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {availableMeals.map(meal => {
                const open = isMealActive(meal.startHour, meal.endHour);
                return (
                  <div
                    key={meal.key}
                    className={`rounded-xl p-4 text-center border transition-all duration-200 ${
                      open ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center mx-auto mb-2">
                      <meal.icon className={`w-5 h-5 ${open ? 'text-red-600' : 'text-gray-400'}`} aria-hidden="true" />
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">{meal.label}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {meal.time}
                    </p>
                    {meal.menu && (
                      <p className="text-xs text-red-600 mt-2 font-medium truncate">{meal.menu}</p>
                    )}
                    <button
                      onClick={() => (open ? handleShowQr(meal.label, meal.key) : undefined)}
                      disabled={!open || generatingQr === meal.key}
                      title={open ? 'Tap to generate QR' : `Opens at ${meal.time.split('–')[0].trim()}`}
                      className={`mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        open ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {generatingQr === meal.key ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      {generatingQr === meal.key ? 'Generating...' : open ? 'Show QR' : 'Not Yet Open'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <SectionCard title="Announcements">
          <div className="space-y-3">
            {announcements.map(ann => (
              <div key={ann.id} className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm">{ann.title}</h3>
                  <span className="badge-active flex-shrink-0">Active</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{ann.description}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(ann.created_at).toLocaleDateString('en-IN')}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* QR Modal */}
      {qrModal && (
        <QRModal
          title={qrModal.type}
          dataUrl={qrModal.dataUrl}
          studentCode={qrModal.fallbackCode}
          onClose={() => setQrModal(null)}
        />
      )}
    </div>
  );
}
