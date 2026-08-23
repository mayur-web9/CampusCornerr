import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, RefreshCw, CheckCircle2, Clock, AlertCircle, Tag, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Subscription, MealPlan, MealVariant, CouponValidationResult } from '../../lib/types';
import { validateCoupon, redeemCoupon, findBestCoupon } from '../../lib/couponService';
import { toast } from 'sonner';

// Window.Razorpay is declared globally in src/types/razorpay.d.ts — no need to redeclare it here.

type SubscriptionPhase = 'active' | 'grace' | 'expired' | 'none';

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface CreateOrderResponse {
  id: string;
  amount: number;
  currency: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayPaymentResponse) => void | Promise<void>;
  modal: { ondismiss: () => void };
  theme: { color: string };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** True when the plan's name is exactly "Campus Solo" (whitespace/case-insensitive). Campus Solo is the
 *  only plan that never allows coupons and is priced by its meal variants — see [[meal-variant-feature]]. */
function isCampusSolo(plan: { plan_name: string } | null | undefined): boolean {
  return plan?.plan_name.trim().toLowerCase() === 'campus solo';
}

/** True when the plan defines one or more selectable meal variants. */
function planHasVariants(plan: MealPlan | undefined): boolean {
  return !!plan?.meal_variants && plan.meal_variants.length > 0;
}

/** Looks up a specific variant on a plan by id. */
function findVariant(plan: MealPlan | undefined, variantId: string): MealVariant | undefined {
  return plan?.meal_variants?.find((v) => v.id === variantId);
}

/** The amount to charge: the selected variant's price when one exists, otherwise the plan's base price. */
function resolveBasePrice(plan: MealPlan, variant: MealVariant | undefined): number {
  return variant ? variant.price : plan.price;
}

function MealProgressCard({ emoji, label, remaining, allocated }: { emoji: string; label: string; remaining: number; allocated: number }) {
  const included = allocated > 0;
  const used = Math.max(allocated - remaining, 0);
  const pct = included ? Math.max(0, Math.min(100, (remaining / allocated) * 100)) : 0;
  const barColor = !included
    ? 'bg-white/20'
    : remaining <= 0
    ? 'bg-red-400'
    : pct <= 30
    ? 'bg-orange-400'
    : 'bg-green-400';

  return (
    <div className="bg-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span aria-hidden="true">{emoji}</span>
        <span className="text-sm font-semibold text-white">{label}</span>
      </div>
      {included ? (
        <>
          <div
            className="h-2 w-full rounded-full bg-white/15 overflow-hidden"
            role="progressbar"
            aria-label={`${label} meals remaining`}
            aria-valuenow={remaining}
            aria-valuemin={0}
            aria-valuemax={allocated}
          >
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-xs font-medium text-white/90">{remaining} Remaining</span>
            <span className="text-xs text-white/60">{used} Used</span>
          </div>
          <p className="text-[11px] text-white/50 mt-1">Total {allocated} Meals</p>
        </>
      ) : (
        <p className="text-xs text-white/50">Not included in this plan</p>
      )}
    </div>
  );
}

function MealKpiCard({ emoji, label, remaining, used }: { emoji: string; label: string; remaining: number; used: number }) {
  return (
    <div className="card card-hover">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg" aria-hidden="true">{emoji}</span>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
      </div>
      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs text-gray-400">Remaining</p>
          <motion.p
            key={remaining}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-xl font-bold text-slate-900"
          >
            {remaining}
          </motion.p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Used</p>
          <p className="text-xl font-bold text-gray-400">{used}</p>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ phase, daysRemaining, graceDaysRemaining }: { phase: SubscriptionPhase; daysRemaining: number; graceDaysRemaining: number }) {
  const content = phase === 'active'
    ? { emoji: '🟢', label: 'Active', sub: `${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Remaining` }
    : phase === 'grace'
    ? { emoji: '🟠', label: 'Grace Period', sub: `${graceDaysRemaining} Day${graceDaysRemaining !== 1 ? 's' : ''} Remaining` }
    : { emoji: '🔴', label: 'Expired', sub: 'Renew Required' };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-right"
    >
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/15 px-3 py-1 rounded-full">
        <span aria-hidden="true">{content.emoji}</span> {content.label}
      </span>
      <p className="text-xs text-white/70 mt-1.5">{content.sub}</p>
    </motion.div>
  );
}

function SubscriptionNotice({ phase, graceEndDate, daysExpiredAgo }: { phase: SubscriptionPhase; graceEndDate: string | null; daysExpiredAgo: number }) {
  if (phase === 'none') return null;

  const config = {
    active: {
      wrap: 'bg-green-50 border-green-200',
      icon: '🎉',
      title: 'Your subscription is active.',
      body: `You have access to all meals included in your plan.${graceEndDate ? ` Unused meals can be redeemed until your Grace Period ends on ${formatDate(graceEndDate)}.` : ''}`,
      titleColor: 'text-green-800',
      bodyColor: 'text-green-700',
    },
    grace: {
      wrap: 'bg-amber-50 border-amber-200',
      icon: '⚠️',
      title: 'Your subscription is in the Grace Period.',
      body: `Use your remaining meals before they expire${graceEndDate ? ` on ${formatDate(graceEndDate)}` : ''}.`,
      titleColor: 'text-amber-800',
      bodyColor: 'text-amber-700',
    },
    expired: {
      wrap: 'bg-red-50 border-red-200',
      icon: '❌',
      title: 'Your subscription has expired.',
      body: `Renew now to continue meal access.${daysExpiredAgo > 0 ? ` (Expired ${daysExpiredAgo} day${daysExpiredAgo !== 1 ? 's' : ''} ago)` : ''}`,
      titleColor: 'text-red-800',
      bodyColor: 'text-red-700',
    },
  } as const;

  const c = config[phase];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 border rounded-xl p-4 ${c.wrap}`}
    >
      <span className="text-xl leading-none mt-0.5" aria-hidden="true">{c.icon}</span>
      <div>
        <p className={`text-sm font-semibold ${c.titleColor}`}>{c.title}</p>
        <p className={`text-xs mt-0.5 ${c.bodyColor}`}>{c.body}</p>
      </div>
    </motion.div>
  );
}

function SubscriptionTimeline({ phase, endDate, graceEndDate, onRenew }: { phase: SubscriptionPhase; endDate: string; graceEndDate: string | null; onRenew: () => void }) {
  const steps: { key: SubscriptionPhase; label: string; date: string | null }[] = [
    { key: 'active', label: 'Subscription Active', date: endDate },
    { key: 'grace', label: 'Grace Period', date: graceEndDate },
  ];

  return (
    <div>
      {steps.map((step, i) => {
        const isCurrent = step.key === phase;
        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isCurrent ? 'bg-white' : 'bg-white/30'}`} aria-hidden="true" />
              {i < steps.length - 1 && <span className="w-px flex-1 bg-white/20 my-1" style={{ minHeight: '24px' }} aria-hidden="true" />}
            </div>
            <div className="pb-3">
              <p className={`text-sm font-semibold ${isCurrent ? 'text-white' : 'text-white/50'}`}>{step.label}</p>
              {step.date && <p className="text-xs text-white/60 mt-0.5">Ends {formatDate(step.date)}</p>}
            </div>
          </div>
        );
      })}
      {phase !== 'active' && phase !== 'none' && (
        <button
          onClick={onRenew}
          className="mt-1 w-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Renew Subscription
        </button>
      )}
    </div>
  );
}

function MealSummaryChips({ sub }: { sub: Subscription }) {
  if (typeof sub.allocated_breakfast !== 'number') return null;
  const items = [
    { label: 'Breakfast', emoji: '🍳', remaining: sub.remaining_breakfast, allocated: sub.allocated_breakfast },
    { label: 'Lunch', emoji: '🍛', remaining: sub.remaining_lunch, allocated: sub.allocated_lunch },
    { label: 'Dinner', emoji: '🌙', remaining: sub.remaining_dinner, allocated: sub.allocated_dinner },
  ];
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map(it => (
        <span key={it.label} className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-100">
          <span aria-hidden="true">{it.emoji}</span> {it.label} {it.remaining}/{it.allocated}
        </span>
      ))}
    </div>
  );
}

export default function StudentSubscription() {
  const { profile } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewModal, setRenewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [renewing, setRenewing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [autoApplying, setAutoApplying] = useState(false);
  const [manualCouponMode, setManualCouponMode] = useState(false);

  // Guards against setting state after unmount (e.g. the student navigates away
  // while loadData()'s network requests are still in flight).
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const [subRes, planRes, variantRes] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('*, plan:meal_plans(*), meal_variant:meal_variants(*)')
          .eq('student_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase.from('meal_plans').select('*').eq('active', true),
        supabase.from('meal_variants').select('*').eq('active', true),
      ]);

      if (subRes.error) {
        console.error('Failed to load subscription history', subRes.error);
        toast.error('Failed to load your subscription history');
      }
      if (planRes.error) {
        console.error('Failed to load meal plans', planRes.error);
        toast.error('Failed to load meal plans');
      }
      if (variantRes.error) {
        console.error('Failed to load meal variants', variantRes.error);
        toast.error('Failed to load meal plan options');
      }

      // Group variants under their parent plan (plans[] ↓ variants[] ↓ plan.meal_variants)
      const variantsByPlan = new Map<string, MealVariant[]>();
      ((variantRes.data ?? []) as MealVariant[]).forEach((variant) => {
        const list = variantsByPlan.get(variant.plan_id) ?? [];
        list.push(variant);
        variantsByPlan.set(variant.plan_id, list);
      });

      const plansWithVariants: MealPlan[] = ((planRes.data ?? []) as MealPlan[]).map((plan) => ({
        ...plan,
        meal_variants: variantsByPlan.get(plan.id) ?? [],
      }));

      if (!isMountedRef.current) return;
      setSubscriptions(subRes.data ?? []);
      setPlans(plansWithVariants);
    } catch (err) {
      console.error('Unexpected error while loading subscription data', err);
      toast.error('Something went wrong while loading your subscription');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) loadData();
  }, [profile, loadData]);

  const isCampusSoloPlan = useCallback(
    (planId: string) => isCampusSolo(plans.find((p) => p.id === planId)),
    [plans]
  );

  const autoApplyBestCoupon = useCallback(
    async (planId: string) => {
      const plan = plans.find((p) => p.id === planId);
      if (!plan || !profile) return;

      setAutoApplying(true);
      setAppliedCoupon(null);
      try {
        const res = await findBestCoupon({
          studentId: profile.id,
          orderAmount: plan.price,
          planId: plan.id,
        });
        if (res.success && res.data) {
          setAppliedCoupon(res.data);
        }
      } finally {
        setAutoApplying(false);
      }
    },
    [plans, profile]
  );

  useEffect(() => {
    if (!renewModal || !selectedPlan) return;

    if (isCampusSoloPlan(selectedPlan)) {
      // Campus Solo never allows discounts — skip auto coupon search entirely.
      setAppliedCoupon(null);
      setCouponCode('');
      setManualCouponMode(false);
      return;
    }

    autoApplyBestCoupon(selectedPlan);
  }, [renewModal, selectedPlan, isCampusSoloPlan, autoApplyBestCoupon]);

  function resetCouponState() {
    setCouponCode('');
    setAppliedCoupon(null);
    setManualCouponMode(false);
  }

  function openRenewModal() {
    resetCouponState();
    setSelectedVariant('');
    setRenewModal(true);
  }

  async function handleApplyCoupon() {
    if (applyingCoupon) return; // prevent duplicate coupon validation on rapid double-clicks

    if (!selectedPlan) {
      toast.error('Please select a plan first');
      return;
    }
    if (isCampusSoloPlan(selectedPlan)) {
      toast.error('Coupons are not available for Campus Solo.');
      return;
    }
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    if (!profile) {
      toast.error('Your session has expired. Please sign in again.');
      return;
    }

    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return;

    setApplyingCoupon(true);
    try {
      const res = await validateCoupon({
        code: couponCode,
        studentId: profile.id,
        orderAmount: plan.price,
        planId: plan.id,
      });

      if (!res.success || !res.data) {
        setAppliedCoupon(null);
        toast.error(res.message);
        return;
      }

      setAppliedCoupon(res.data);
      toast.success('Coupon applied successfully');
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function handleSubscribe() {
    if (renewing) return; // prevent duplicate payment windows on rapid double-clicks

    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return;

    const selectedVariantObj = findVariant(plan, selectedVariant);
    if (planHasVariants(plan) && !selectedVariantObj) {
      toast.error('Please select an option to continue');
      return;
    }

    if (isActive) {
      toast.error('You already have an active subscription. Please wait until it expires.');
      return;
    }

    if (!profile) {
      toast.error('Your session has expired. Please sign in again.');
      return;
    }

    // When variants exist, the variant's price always takes precedence over the plan's base price.
    const basePrice = resolveBasePrice(plan, selectedVariantObj);
    const finalAmount = isCampusSolo(plan) ? basePrice : (appliedCoupon ? appliedCoupon.finalAmount : basePrice);

    try {
      setRenewing(true);

      // Create Razorpay Order from Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalAmount * 100 }),
      });

      const order = (await response.json()) as CreateOrderResponse;

      if (!order.id) {
        toast.error('Failed to create payment order');
        return;
      }

      const options: RazorpayCheckoutOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: 'Cafeteria',
        description: plan.plan_name,

        handler: async (response) => {
          try {
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + plan.duration_days - 1);

            const graceEndDate = new Date(endDate);
            graceEndDate.setDate(graceEndDate.getDate() + (plan.grace_days ?? 0));

            const { data: newSub, error } = await supabase
              .from('subscriptions')
              .insert({
                student_id: profile.id,
                plan_id: plan.id,
                meal_variant_id: selectedVariantObj?.id ?? null,
                amount_paid: finalAmount,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                status: 'active',
                payment_status: 'paid',
                renewed_from: current?.id ?? null,
                allocated_breakfast: plan.breakfast_limit,
                allocated_lunch: plan.lunch_limit,
                allocated_dinner: plan.dinner_limit,
                remaining_breakfast: plan.breakfast_limit,
                remaining_lunch: plan.lunch_limit,
                remaining_dinner: plan.dinner_limit,
                grace_end_date: graceEndDate.toISOString().split('T')[0],
              })
              .select()
              .single();

            if (error || !newSub) {
              console.error('Failed to create subscription', error);
              toast.error('Failed to create subscription');
              return;
            }

            const { data: newPayment, error: paymentError } = await supabase
              .from('payments')
              .insert({
                student_id: profile.id,
                subscription_id: newSub.id,
                amount: finalAmount,
                transaction_id: response.razorpay_payment_id,
                payment_gateway: 'razorpay',
                payment_status: 'paid',
              })
              .select()
              .single();

            if (paymentError) {
              // Subscription is already active at this point — log for follow-up rather
              // than alarming the student with an error after a successful charge.
              console.error('Failed to record payment', paymentError);
            }

            // Coupon is only redeemed after payment + subscription succeed
            if (appliedCoupon && newPayment) {
              const redemption = await redeemCoupon({
                couponId: appliedCoupon.coupon.id,
                couponCode: appliedCoupon.coupon.code,
                studentId: profile.id,
                subscriptionId: newSub.id,
                paymentId: newPayment.id,
                discountAmount: appliedCoupon.discount,
                originalAmount: appliedCoupon.originalAmount,
                finalAmount: appliedCoupon.finalAmount,
              });
              if (!redemption.success) {
                console.error('Failed to redeem coupon', redemption.message);
              }
            }

            toast.success('Payment Successful! Subscription Activated.');

            setRenewModal(false);
            setSelectedPlan('');
            setSelectedVariant('');
            resetCouponState();

            loadData();
          } catch (err) {
            console.error('Unexpected error while finalizing subscription', err);
            toast.error('Something went wrong');
          }
        },

        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
          },
        },

        theme: {
          color: '#dc2626',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Failed to start payment', err);
      toast.error('Failed to start payment');
    } finally {
      setRenewing(false);
    }
  }

  // ── Presentation-only derived values (UX layer) ──────────────────
  // Phase/countdown math is purely for display; access control still
  // lives in Scanner.tsx and is untouched here.
  const { current, isActive, subscriptionPhase, daysRemaining, graceDaysRemaining, daysExpiredAgo } = useMemo(() => {
    const latest = subscriptions[0];
    const now = new Date();
    const active = !!latest && new Date(latest.end_date) >= now && latest.status === 'active';

    const graceEndRaw = latest?.grace_end_date ? new Date(latest.grace_end_date) : null;
    const isInGrace = !!latest && !active && latest.status !== 'cancelled' && !!graceEndRaw && graceEndRaw >= now;
    const phase: SubscriptionPhase = !latest ? 'none' : active ? 'active' : isInGrace ? 'grace' : 'expired';

    const remaining = active ? Math.ceil((new Date(latest.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const graceRemaining = isInGrace && graceEndRaw
      ? Math.ceil((graceEndRaw.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const expiredAgo = phase === 'expired' && latest
      ? Math.max(0, Math.floor((now.getTime() - (graceEndRaw ?? new Date(latest.end_date)).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      current: latest,
      isActive: active,
      subscriptionPhase: phase,
      daysRemaining: remaining,
      graceDaysRemaining: graceRemaining,
      daysExpiredAgo: expiredAgo,
    };
  }, [subscriptions]);

  const { selectedPlanObj, selectedPlanVariants, selectedPlanHasVariants, isCouponAllowed, previewAmount } = useMemo(() => {
    const plan = plans.find((p) => p.id === selectedPlan);
    const hasVariants = planHasVariants(plan);
    const variant = findVariant(plan, selectedVariant);
    const couponAllowed = !plan || !isCampusSolo(plan);
    const basePrice = plan ? resolveBasePrice(plan, variant) : 0;

    return {
      selectedPlanObj: plan,
      selectedPlanVariants: plan?.meal_variants ?? [],
      selectedPlanHasVariants: hasVariants,
      isCouponAllowed: couponAllowed,
      previewAmount: couponAllowed && appliedCoupon ? appliedCoupon.finalAmount : basePrice,
    };
  }, [plans, selectedPlan, selectedVariant, appliedCoupon]);

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
        {/* Only show Subscribe button when there is NO active subscription */}
        {!isActive && (
          <button onClick={openRenewModal} className="btn-primary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            {current ? 'Resubscribe' : 'Subscribe'}
          </button>
        )}
      </div>

      {/* Subscription Notice */}
      <SubscriptionNotice phase={subscriptionPhase} graceEndDate={current?.grace_end_date ?? null} daysExpiredAgo={daysExpiredAgo} />

      {/* Current Plan */}
      {current ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={`rounded-2xl p-6 text-white shadow-lg ${isActive ? 'bg-gradient-to-br from-red-600 to-red-700' : 'bg-gradient-to-br from-gray-500 to-gray-600'}`}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Current Plan</p>
              <h2 className="text-xl font-bold mt-1">{current.plan?.plan_name}</h2>
              {current.meal_variant && (
                <p className="text-white/80 text-sm mt-0.5">{current.meal_variant.variant_name}</p>
              )}
            </div>
            <StatusPill phase={subscriptionPhase} daysRemaining={daysRemaining} graceDaysRemaining={graceDaysRemaining} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-white/60 text-xs">Amount Paid</p>
              <p className="text-sm font-bold mt-0.5">₹{current.amount_paid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Start Date</p>
              <p className="text-sm font-medium mt-0.5">{formatDate(current.start_date)}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">End Date</p>
              <p className="text-sm font-medium mt-0.5">{formatDate(current.end_date)}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Payment</p>
              <p className="text-sm font-medium mt-0.5 capitalize">{current.payment_status}</p>
            </div>
          </div>

          {/* Meal Balances */}
          {typeof current.remaining_breakfast === 'number' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/20">
              <MealProgressCard emoji="🍳" label="Breakfast" remaining={current.remaining_breakfast ?? 0} allocated={current.allocated_breakfast ?? 0} />
              <MealProgressCard emoji="🍛" label="Lunch" remaining={current.remaining_lunch ?? 0} allocated={current.allocated_lunch ?? 0} />
              <MealProgressCard emoji="🌙" label="Dinner" remaining={current.remaining_dinner ?? 0} allocated={current.allocated_dinner ?? 0} />
            </div>
          )}

          {/* Timeline */}
          <div className="mt-5 pt-5 border-t border-white/20">
            <SubscriptionTimeline
              phase={subscriptionPhase}
              endDate={current.end_date}
              graceEndDate={current.grace_end_date}
              onRenew={openRenewModal}
            />
          </div>
        </motion.div>
      ) : (
        <div className="card text-center py-10">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900">No Active Subscription</h3>
          <p className="text-gray-500 text-sm mt-1">Subscribe to a meal plan to get started</p>
          <button onClick={openRenewModal} className="btn-primary mt-4 px-6">Subscribe Now</button>
        </div>
      )}

      {/* Meal Statistics */}
      {current && typeof current.remaining_breakfast === 'number' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <MealKpiCard emoji="🍳" label="Breakfast" remaining={current.remaining_breakfast ?? 0} used={Math.max((current.allocated_breakfast ?? 0) - (current.remaining_breakfast ?? 0), 0)} />
          <MealKpiCard emoji="🍛" label="Lunch" remaining={current.remaining_lunch ?? 0} used={Math.max((current.allocated_lunch ?? 0) - (current.remaining_lunch ?? 0), 0)} />
          <MealKpiCard emoji="🌙" label="Dinner" remaining={current.remaining_dinner ?? 0} used={Math.max((current.allocated_dinner ?? 0) - (current.remaining_dinner ?? 0), 0)} />
        </motion.div>
      )}

      {/* Subscription History */}
      {subscriptions.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Subscription History</h3>
          <div className="space-y-3">
            {subscriptions.map((sub, i) => {
              const subActive = new Date(sub.end_date) >= new Date() && sub.status === 'active';
              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100/70 transition-colors duration-150"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${subActive ? 'bg-green-100' : 'bg-gray-200'}`}>
                      {subActive ? <CheckCircle2 className="w-5 h-5 text-green-600" aria-hidden="true" /> : <Clock className="w-5 h-5 text-gray-400" aria-hidden="true" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{sub.plan?.plan_name}</p>
                        {sub.meal_variant && <span className="text-xs text-gray-400">• {sub.meal_variant.variant_name}</span>}
                        {i === 0 && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Latest</span>}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${subActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                          {subActive ? 'Active' : 'Expired'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(sub.start_date)} – {formatDate(sub.end_date)}
                      </p>
                    </div>
                    <p className="font-bold text-gray-900 text-sm flex-shrink-0">₹{sub.amount_paid.toLocaleString()}</p>
                  </div>
                  <MealSummaryChips sub={sub} />
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subscribe Modal — only shown when no active subscription */}
      {renewModal && !isActive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-1">New Subscription</h2>
            <p className="text-sm text-gray-500 mb-5">Select a meal plan to activate</p>
            <div className="space-y-3 mb-5">
              {plans.map(plan => {
                const includedMeals = [plan.breakfast && 'Breakfast', plan.lunch && 'Lunch', plan.dinner && 'Dinner'].filter(Boolean) as string[];
                return (
                  <label key={plan.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedPlan === plan.id ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input type="radio" name="plan" value={plan.id} checked={selectedPlan === plan.id} onChange={() => { setSelectedPlan(plan.id); setSelectedVariant(''); setCouponCode(''); setManualCouponMode(false); }} className="sr-only" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{plan.plan_name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {includedMeals.length > 0 && (
                          <span className="text-xs text-gray-500">{includedMeals.join(' • ')}</span>
                        )}
                        <span className="text-xs text-gray-400">• {plan.duration_days} days</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {planHasVariants(plan) ? (
                        <p className="text-xs font-medium text-gray-400">Select option</p>
                      ) : (
                        <p className="font-bold text-red-600">₹{plan.price.toLocaleString()}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Meal Variants — shown only when the selected plan has variants defined */}
            {selectedPlanHasVariants && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Choose your option</label>
                <p className="text-xs text-gray-500 mb-3">Select a variant to continue</p>
                <div className="space-y-3">
                  {selectedPlanVariants.map(variant => {
                    const isSelected = selectedVariant === variant.id;
                    return (
                      <label
                        key={variant.id}
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all shadow-sm ${isSelected ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <input
                          type="radio"
                          name="variant"
                          value={variant.id}
                          checked={isSelected}
                          onChange={() => setSelectedVariant(variant.id)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${isSelected ? 'border-red-500 bg-red-500' : 'border-gray-300'}`}>
                          {isSelected && <Check className="w-3 h-3 text-white" aria-hidden="true" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{variant.variant_name}</p>
                          {variant.description && (
                            <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-line">{variant.description}</p>
                          )}
                        </div>
                        <p className="font-bold text-red-600 text-sm flex-shrink-0">₹{variant.price.toLocaleString()}</p>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coupon */}
            {selectedPlan && !isCouponAllowed && (
              <div className="mb-5">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-900">Discounts Not Available</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Campus Solo is already offered at a special monthly price. Coupons and promotional offers are not applicable on this plan.
                  </p>
                </div>
              </div>
            )}

            {selectedPlan && isCouponAllowed && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon</label>

                {autoApplying ? (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Finding the best offer...</span>
                  </div>
                ) : appliedCoupon && !manualCouponMode ? (
                  <div className="flex items-start justify-between gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-semibold text-green-800">Best Offer Applied</p>
                      </div>
                      <p className="text-xs text-green-700 mt-1">{appliedCoupon.coupon.name} ({appliedCoupon.coupon.code})</p>
                      <div className="text-xs text-gray-600 mt-2 space-y-0.5">
                        <p>Original Amount: <span className="font-medium">₹{appliedCoupon.originalAmount.toLocaleString()}</span></p>
                        <p>Discount: <span className="font-medium text-green-700">-₹{appliedCoupon.discount.toLocaleString()}</span></p>
                        <p>Final Amount: <span className="font-bold text-gray-900">₹{appliedCoupon.finalAmount.toLocaleString()}</span></p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setManualCouponMode(true); setCouponCode(''); }}
                      className="text-xs font-semibold text-red-600 hover:underline flex-shrink-0"
                    >
                      Change Coupon
                    </button>
                  </div>
                ) : manualCouponMode ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="input-field flex-1 font-mono"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon || !couponCode.trim()}
                        className="btn-secondary flex-shrink-0 disabled:opacity-50"
                      >
                        {applyingCoupon ? <div className="w-4 h-4 border-2 border-gray-400/40 border-t-gray-600 rounded-full animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                    <button
                      onClick={() => { setManualCouponMode(false); setCouponCode(''); autoApplyBestCoupon(selectedPlan); }}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      &larr; Use best available offer
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-sm text-gray-500">No offers available</p>
                    <button
                      onClick={() => setManualCouponMode(true)}
                      className="text-xs font-semibold text-red-600 hover:underline flex-shrink-0"
                    >
                      Have a coupon?
                    </button>
                  </div>
                )}
              </div>
            )}

            {selectedPlanObj && (
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-sm text-gray-500">Total Payable</span>
                <span className="text-lg font-bold text-gray-900">₹{previewAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setRenewModal(false); setSelectedPlan(''); setSelectedVariant(''); resetCouponState(); }} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleSubscribe}
                disabled={renewing || !selectedPlan || (selectedPlanHasVariants && !selectedVariant)}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {renewing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Guard: if somehow modal is opened while active, block it */}
      {renewModal && isActive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center"
          >
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Subscription Already Active</h2>
            <p className="text-sm text-gray-500 mb-1">
              Your current plan is active until
            </p>
            <p className="text-base font-semibold text-gray-800 mb-4">
              {formatDate(current.end_date)}
            </p>
            <p className="text-xs text-gray-400 mb-5">
              You can subscribe to a new plan once your current subscription expires.
            </p>
            <button onClick={() => setRenewModal(false)} className="btn-primary w-full">Got it</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
