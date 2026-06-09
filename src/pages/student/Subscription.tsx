import { useEffect, useState } from 'react';
import { CreditCard, Calendar, RefreshCw, CheckCircle2, Clock, IndianRupee } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Subscription, MealPlan } from '../../lib/types';
import { toast } from 'sonner';

export default function StudentSubscription() {
  const { profile } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewModal, setRenewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    if (profile) loadData();
  }, [profile]);

  async function loadData() {
    const [subRes, planRes] = await Promise.all([
      supabase.from('subscriptions').select('*, plan:meal_plans(*)').eq('student_id', (profile as any).id).order('created_at', { ascending: false }),
      supabase.from('meal_plans').select('*').eq('active', true),
    ]);
    setSubscriptions(subRes.data ?? []);
    setPlans(planRes.data ?? []);
    setLoading(false);
  }

  async function handleRenew() {
    if (!selectedPlan) { toast.error('Please select a plan'); return; }
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    setRenewing(true);
    const current = subscriptions[0];
    const startDate = current && new Date(current.end_date) > new Date()
      ? new Date(current.end_date)
      : new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration_days - 1);

    const { data: newSub, error } = await supabase.from('subscriptions').insert({
      student_id: (profile as any).id,
      plan_id: plan.id,
      amount_paid: plan.price,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: 'active',
      payment_status: 'paid',
      renewed_from: current?.id ?? null,
    }).select().single();

    if (error) { toast.error('Failed to renew subscription'); setRenewing(false); return; }

    if (newSub) {
      await supabase.from('payments').insert({
        student_id: (profile as any).id,
        subscription_id: newSub.id,
        amount: plan.price,
        payment_gateway: 'manual',
        payment_status: 'paid',
      });
    }

    toast.success('Subscription renewed successfully!');
    setRenewing(false);
    setRenewModal(false);
    loadData();
  }

  const current = subscriptions[0];
  const isActive = current && new Date(current.end_date) >= new Date() && current.status === 'active';

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-48 bg-gray-200 rounded-xl" />
      <div className="h-32 bg-gray-200 rounded-xl" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your meal subscription</p>
        </div>
        <button onClick={() => setRenewModal(true)} className="btn-primary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          {isActive ? 'Renew' : 'Subscribe'}
        </button>
      </div>

      {/* Current Plan */}
      {current ? (
        <div className={`rounded-2xl p-6 text-white shadow-lg ${isActive ? 'bg-gradient-to-br from-red-600 to-red-700' : 'bg-gradient-to-br from-gray-500 to-gray-600'}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Current Plan</p>
              <h2 className="text-xl font-bold mt-1">{(current.plan as any)?.plan_name}</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isActive ? 'bg-green-400/20 text-green-100' : 'bg-white/10 text-white/60'}`}>
              {isActive ? 'Active' : 'Expired'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-white/60 text-xs">Amount Paid</p>
              <p className="text-sm font-bold mt-0.5">₹{current.amount_paid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Start Date</p>
              <p className="text-sm font-medium mt-0.5">{new Date(current.start_date).toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">End Date</p>
              <p className="text-sm font-medium mt-0.5">{new Date(current.end_date).toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Payment</p>
              <p className="text-sm font-medium mt-0.5 capitalize">{current.payment_status}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-10">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900">No Active Subscription</h3>
          <p className="text-gray-500 text-sm mt-1">Subscribe to a meal plan to get started</p>
          <button onClick={() => setRenewModal(true)} className="btn-primary mt-4 px-6">Subscribe Now</button>
        </div>
      )}

      {/* Subscription History */}
      {subscriptions.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Subscription History</h3>
          <div className="space-y-3">
            {subscriptions.map((sub, i) => {
              const subActive = new Date(sub.end_date) >= new Date() && sub.status === 'active';
              return (
                <div key={sub.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${subActive ? 'bg-green-100' : 'bg-gray-200'}`}>
                    {subActive ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{(sub.plan as any)?.plan_name}</p>
                      {i === 0 && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Latest</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(sub.start_date).toLocaleDateString('en-IN')} – {new Date(sub.end_date).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">₹{sub.amount_paid.toLocaleString()}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${subActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {subActive ? 'Active' : 'Expired'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {renewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{isActive ? 'Renew Subscription' : 'New Subscription'}</h2>
            <p className="text-sm text-gray-500 mb-5">Select a meal plan</p>
            <div className="space-y-3 mb-5">
              {plans.map(plan => (
                <label key={plan.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPlan === plan.id ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
                  <input type="radio" name="plan" value={plan.id} checked={selectedPlan === plan.id} onChange={() => setSelectedPlan(plan.id)} className="sr-only" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{plan.plan_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {plan.breakfast && <span className="text-xs text-gray-500">Breakfast</span>}
                      {plan.lunch && <span className="text-xs text-gray-500">Lunch</span>}
                      {plan.dinner && <span className="text-xs text-gray-500">Dinner</span>}
                      <span className="text-xs text-gray-400">• {plan.duration_days} days</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">₹{plan.price.toLocaleString()}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRenewModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleRenew} disabled={renewing || !selectedPlan} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {renewing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
