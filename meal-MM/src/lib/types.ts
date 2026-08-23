export type UserRole = 'student' | 'staff' | 'admin';

export interface Student {
  id: string;
  user_id: string | null;
  student_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  college_id: string | null;
  room_number: string | null;
  hostel_block: string | null;
  role: UserRole;
  qr_code: string | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: 'staff' | 'supervisor' | 'manager';
  active: boolean;
  created_at: string;
}

export interface MealPlan {
  id: string;
  plan_code: string;
  plan_name: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  duration_days: number;
  price: number;
  active: boolean;
  created_at: string;
  breakfast_limit: number | null;
  lunch_limit: number | null;
  dinner_limit: number | null;
  grace_days: number | null;
  meal_variants?: MealVariant[];
}

export interface MealVariant {
  id: string;
  plan_id: string;
  variant_name: string;
  description: string | null;
  price: number;
  active: boolean;
  created_at?: string;
}

export interface Subscription {
  id: string;
  student_id: string;
  plan_id: string | null;
  meal_variant_id: string | null;
  amount_paid: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  payment_status: 'paid' | 'pending' | 'failed';
  renewed_from: string | null;
  created_at: string;
  student?: Student;
  plan?: MealPlan;
  meal_variant?: MealVariant | null;
  allocated_breakfast: number | null;
  allocated_lunch: number | null;
  allocated_dinner: number | null;
  remaining_breakfast: number | null;
  remaining_lunch: number | null;
  remaining_dinner: number | null;
  grace_end_date: string | null;
}

export interface Payment {
  id: string;
  student_id: string;
  subscription_id: string;
  amount: number;
  transaction_id: string | null;
  payment_gateway: string;
  payment_status: 'paid' | 'pending' | 'failed';
  paid_at: string;
  student?: Student;
  subscription?: Subscription;
}

export interface MealLog {
  id: string;
  student_id: string;
  subscription_id: string | null;
  staff_id: string | null;
  meal_session: 'breakfast' | 'lunch' | 'dinner';
  meal_date: string;
  served_at: string;
  student?: Student;
  staff?: Staff;
}

export interface Menu {
  id: string;
  meal_date: string;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  profile: Student | Staff | null;
}

export interface QRPayload {
  studentId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  timestamp: number;
}

export interface ScanResult {
  success: boolean;
  message: string;
  student?: Student;
  subscription?: Subscription;
  mealType?: string;
}
/* ============================
   POLLS
============================ */

export interface Poll {
  id: string;
  title: string;
  description: string | null;

  active: boolean;

  status: 'draft' | 'active' | 'closed';

  created_by: string;

  created_at: string;

  updated_at: string;

  expires_at: string | null;

  show_results: boolean;
}

export interface PollOption {
  id: string;

  poll_id: string;

  option_text: string;

  display_order: number;
}

export interface PollVote {
  id: string;

  poll_id: string;

  option_id: string;

  student_id: string;

  voted_at: string;
}

export interface PollResult {
  option_id: string;

  option_text: string;

  votes: number;

  percentage: number;
}

export interface CreatePollData {
  title: string;

  description?: string;

  options: string[];

  expires_at?: string | null;

  show_results: boolean;
}
export interface VoteData {
  poll_id: string;
  option_id: string;
}

/* ============================
   COUPONS
============================ */

export type DiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount: number | null;
  applicable_plan_id: string | null;
  valid_from: string;
  valid_until: string;
  max_total_redemptions: number | null;
  redeemed_count: number;
  max_redemptions_per_student: number | null;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CouponRedemption {
  id: string;
  coupon_id: string;
  student_id: string;
  subscription_id: string | null;
  payment_id: string;
  coupon_code: string;
  discount_amount: number;
  original_amount: number;
  final_amount: number;
  redeemed_at: string;
}

export interface CouponFormValues {
  code: string;
  name: string;
  description: string;
  discount_type: DiscountType;
  discount_value: string;
  maximum_discount: string;
  minimum_order_amount: string;
  applicable_plan_id: string;
  valid_from: string;
  valid_until: string;
  max_total_redemptions: string;
  max_redemptions_per_student: string;
  active: boolean;
}

export interface CouponValidationResult {
  coupon: Coupon;
  discount: number;
  originalAmount: number;
  finalAmount: number;
}

export interface CouponStatistics {
  totalCoupons: number;
  activeCoupons: number;
  disabledCoupons: number;
  expiredCoupons: number;
  redeemedCoupons: number;
  discountGiven: number;
}