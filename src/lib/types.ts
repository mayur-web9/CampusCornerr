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
}

export interface Subscription {
  id: string;
  student_id: string;
  plan_id: string | null;
  amount_paid: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  payment_status: 'paid' | 'pending' | 'failed';
  renewed_from: string | null;
  created_at: string;
  student?: Student;
  plan?: MealPlan;
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
