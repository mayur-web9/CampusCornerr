import { supabase } from './supabase';
import {
  Coupon,
  CouponRedemption,
  CouponFormValues,
  CouponStatistics,
  CouponValidationResult,
} from './types';

export interface ServiceResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

function ok<T>(data: T, message = 'Success'): ServiceResponse<T> {
  return { success: true, message, data };
}

function fail<T>(message: string): ServiceResponse<T> {
  return { success: false, message, data: null };
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}

function toNullableNumber(value: string): number | null {
  return value === '' ? null : Number(value);
}

function buildCouponPayload(values: CouponFormValues) {
  return {
    code: values.code.trim().toUpperCase(),
    name: values.name.trim(),
    description: values.description.trim() || null,
    discount_type: values.discount_type,
    discount_value: Number(values.discount_value),
    maximum_discount: toNullableNumber(values.maximum_discount),
    minimum_order_amount: values.minimum_order_amount === '' ? 0 : Number(values.minimum_order_amount),
    applicable_plan_id: values.applicable_plan_id === '' ? null : values.applicable_plan_id,
    valid_from: values.valid_from,
    valid_until: values.valid_until,
    max_total_redemptions: toNullableNumber(values.max_total_redemptions),
    max_redemptions_per_student: toNullableNumber(values.max_redemptions_per_student),
    active: values.active,
  };
}

/**
 * Fetch all coupons, most recently created first.
 */
export async function getCoupons(): Promise<ServiceResponse<Coupon[]>> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return fail(error.message);
    return ok((data ?? []) as Coupon[]);
  } catch (err) {
    return fail(errorMessage(err, 'Failed to load coupons'));
  }
}

/**
 * Fetch a single coupon by id.
 */
export async function getCoupon(id: string): Promise<ServiceResponse<Coupon>> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) return fail(error.message);
    if (!data) return fail('Coupon not found');
    return ok(data as Coupon);
  } catch (err) {
    return fail(errorMessage(err, 'Failed to load coupon'));
  }
}

/**
 * Create a new coupon.
 */
export async function createCoupon(values: CouponFormValues): Promise<ServiceResponse<Coupon>> {
  try {
    const payload = { ...buildCouponPayload(values), redeemed_count: 0 };

    const { data, error } = await supabase
      .from('coupons')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return fail('A coupon with this code already exists');
      return fail(error.message);
    }
    return ok(data as Coupon, 'Coupon created successfully');
  } catch (err) {
    return fail(errorMessage(err, 'Failed to create coupon'));
  }
}

/**
 * Update an existing coupon.
 */
export async function updateCoupon(id: string, values: CouponFormValues): Promise<ServiceResponse<Coupon>> {
  try {
    const payload = { ...buildCouponPayload(values), updated_at: new Date().toISOString() };

    const { data, error } = await supabase
      .from('coupons')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return fail('A coupon with this code already exists');
      return fail(error.message);
    }
    return ok(data as Coupon, 'Coupon updated successfully');
  } catch (err) {
    return fail(errorMessage(err, 'Failed to update coupon'));
  }
}

/**
 * Delete a coupon.
 */
export async function deleteCoupon(id: string): Promise<ServiceResponse<null>> {
  try {
    const { error } = await supabase.from('coupons').delete().eq('id', id);

    if (error) {
      if (error.code === '23503') return fail('Cannot delete a coupon that has already been redeemed');
      return fail(error.message);
    }
    return ok(null, 'Coupon deleted successfully');
  } catch (err) {
    return fail(errorMessage(err, 'Failed to delete coupon'));
  }
}

/**
 * Build a draft copy of a coupon for the "Duplicate" flow. Does not write to
 * the database — the dialog lets the admin adjust the code before creating it.
 * Copies name/description/discount/dates/limits/plan; redeemed_count,
 * created_at and updated_at are never carried over, and a new code is generated.
 */
export async function duplicateCoupon(id: string): Promise<ServiceResponse<Coupon>> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) return fail(error.message);
    if (!data) return fail('Coupon not found');

    const source = data as Coupon;
    const newCode = `${source.code}-COPY-${Date.now().toString(36).toUpperCase()}`;

    const draft: Coupon = {
      ...source,
      id: '',
      code: newCode,
      name: `${source.name} (Copy)`,
      active: false,
      redeemed_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return ok(draft);
  } catch (err) {
    return fail(errorMessage(err, 'Failed to duplicate coupon'));
  }
}

/**
 * Toggle a coupon between active and disabled.
 */
export async function toggleCoupon(id: string, currentActive: boolean): Promise<ServiceResponse<Coupon>> {
  try {
    const nextActive = !currentActive;
    const { data, error } = await supabase
      .from('coupons')
      .update({ active: nextActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return fail(error.message);
    return ok(data as Coupon, `Coupon ${nextActive ? 'enabled' : 'disabled'}`);
  } catch (err) {
    return fail(errorMessage(err, 'Failed to update coupon status'));
  }
}

export interface ValidateCouponParams {
  code: string;
  studentId: string;
  orderAmount: number;
  planId?: string;
}

/**
 * Validate a coupon code against all business rules and compute the discount.
 * Read-only — never marks the coupon as redeemed.
 *
 * Validation order: exists -> active -> valid_from -> valid_until ->
 * minimum order -> total redemption limit -> per-student limit -> plan match -> discount.
 */
export async function validateCoupon(params: ValidateCouponParams): Promise<ServiceResponse<CouponValidationResult>> {
  try {
    const { code, studentId, orderAmount, planId } = params;

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .ilike('code', code.trim())
      .maybeSingle();

    if (error) return fail(error.message);
    if (!data) return fail('Invalid coupon code');

    const coupon = data as Coupon;

    if (!coupon.active) return fail('This coupon is not active');

    const today = new Date(new Date().toISOString().split('T')[0]);
    const validFrom = new Date(coupon.valid_from);
    const validUntil = new Date(coupon.valid_until);

    if (today < validFrom) return fail('This coupon is not valid yet');
    if (today > validUntil) return fail('This coupon has expired');

    if (orderAmount < coupon.minimum_order_amount) {
      return fail(`Minimum order amount for this coupon is ₹${coupon.minimum_order_amount.toLocaleString()}`);
    }

    if (coupon.max_total_redemptions !== null && coupon.redeemed_count >= coupon.max_total_redemptions) {
      return fail('This coupon has reached its maximum redemption limit');
    }

    if (coupon.max_redemptions_per_student !== null) {
      const { count, error: countError } = await supabase
        .from('coupon_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('student_id', studentId);

      if (countError) return fail(countError.message);
      if ((count ?? 0) >= coupon.max_redemptions_per_student) {
        return fail('You have already used this coupon the maximum number of times');
      }
    }

    if (coupon.applicable_plan_id && planId && coupon.applicable_plan_id !== planId) {
      return fail('This coupon is not applicable to the selected plan');
    }

    let discount = coupon.discount_type === 'percentage'
      ? (orderAmount * coupon.discount_value) / 100
      : coupon.discount_value;

    if (coupon.maximum_discount !== null) discount = Math.min(discount, coupon.maximum_discount);
    discount = Math.min(discount, orderAmount);
    discount = Math.round(discount * 100) / 100;

    const finalAmount = Math.max(orderAmount - discount, 0);

    return ok({ coupon, discount, originalAmount: orderAmount, finalAmount }, 'Coupon applied successfully');
  } catch (err) {
    return fail(errorMessage(err, 'Failed to validate coupon'));
  }
}

export interface FindBestCouponParams {
  studentId: string;
  orderAmount: number;
  planId?: string;
}

/**
 * Fetch all active, in-window coupons applicable to the plan, validate each
 * one through the same rules as validateCoupon, and return whichever yields
 * the highest discount. Read-only — never marks a coupon as redeemed.
 */
export async function findBestCoupon(params: FindBestCouponParams): Promise<ServiceResponse<CouponValidationResult>> {
  try {
    const { studentId, orderAmount, planId } = params;
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('active', true)
      .lte('valid_from', today)
      .gte('valid_until', today);

    if (error) return fail(error.message);

    const candidates = ((data ?? []) as Coupon[]).filter(
      c => !c.applicable_plan_id || c.applicable_plan_id === planId
    );

    let best: CouponValidationResult | null = null;

    for (const candidate of candidates) {
      const result = await validateCoupon({ code: candidate.code, studentId, orderAmount, planId });
      if (result.success && result.data && (!best || result.data.discount > best.discount)) {
        best = result.data;
      }
    }

    if (!best) return fail('No offers available');
    return ok(best, 'Best coupon applied automatically');
  } catch (err) {
    return fail(errorMessage(err, 'Failed to find the best coupon'));
  }
}

export interface RedeemCouponParams {
  couponId: string;
  couponCode: string;
  studentId: string;
  subscriptionId: string;
  paymentId: string;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
}

/**
 * Record a coupon redemption after a payment has succeeded. Must only be
 * called post-payment — never reserves/redeems a coupon ahead of payment.
 */
export async function redeemCoupon(params: RedeemCouponParams): Promise<ServiceResponse<CouponRedemption>> {
  try {
    const { couponId, couponCode, studentId, subscriptionId, paymentId, discountAmount, originalAmount, finalAmount } = params;

    const { data: redemption, error: redemptionError } = await supabase
      .from('coupon_redemptions')
      .insert({
        coupon_id: couponId,
        student_id: studentId,
        subscription_id: subscriptionId,
        payment_id: paymentId,
        coupon_code: couponCode,
        discount_amount: discountAmount,
        original_amount: originalAmount,
        final_amount: finalAmount,
      })
      .select()
      .single();

    if (redemptionError) return fail(redemptionError.message);

    const { data: coupon } = await supabase
      .from('coupons')
      .select('redeemed_count')
      .eq('id', couponId)
      .maybeSingle();

    if (coupon) {
      await supabase
        .from('coupons')
        .update({ redeemed_count: (coupon.redeemed_count ?? 0) + 1 })
        .eq('id', couponId);
    }

    await supabase
      .from('payments')
      .update({ coupon_redemption_id: redemption.id })
      .eq('id', paymentId);

    return ok(redemption as CouponRedemption, 'Coupon redeemed successfully');
  } catch (err) {
    return fail(errorMessage(err, 'Failed to redeem coupon'));
  }
}

/**
 * Aggregate coupon statistics for the admin dashboard cards.
 */
export async function getCouponStatistics(): Promise<ServiceResponse<CouponStatistics>> {
  try {
    const [couponsRes, redemptionsRes] = await Promise.all([
      supabase.from('coupons').select('active, valid_until'),
      supabase.from('coupon_redemptions').select('discount_amount'),
    ]);

    if (couponsRes.error) return fail(couponsRes.error.message);
    if (redemptionsRes.error) return fail(redemptionsRes.error.message);

    const coupons = couponsRes.data ?? [];
    const redemptions = redemptionsRes.data ?? [];
    const today = new Date(new Date().toISOString().split('T')[0]);

    const totalCoupons = coupons.length;
    const expiredCoupons = coupons.filter(c => new Date(c.valid_until) < today).length;
    const activeCoupons = coupons.filter(c => c.active && new Date(c.valid_until) >= today).length;
    const disabledCoupons = coupons.filter(c => !c.active).length;
    const redeemedCoupons = redemptions.length;
    const discountGiven = redemptions.reduce((sum, r) => sum + (r.discount_amount ?? 0), 0);

    return ok({ totalCoupons, activeCoupons, disabledCoupons, expiredCoupons, redeemedCoupons, discountGiven });
  } catch (err) {
    return fail(errorMessage(err, 'Failed to load coupon statistics'));
  }
}
