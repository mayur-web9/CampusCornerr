-- ==========================================
-- STEP 1: CLEANUP / DROP EXISTING TABLES
-- ==========================================
DROP TABLE IF EXISTS meal_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS meal_plans CASCADE;
DROP TABLE IF EXISTS menus CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- STEP 2: CREATE SCHEMA
-- ==========================================

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  college_id TEXT,
  room_number TEXT,
  hostel_block TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'staff', 'admin')),
  qr_code TEXT,
  profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_students" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_students" ON students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_students" ON students FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_students" ON students FOR DELETE TO authenticated USING (auth.uid() IN (SELECT user_id FROM students WHERE role = 'admin'));

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'supervisor', 'manager')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_staff" ON staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_staff" ON staff FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_staff" ON staff FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_staff" ON staff FOR DELETE TO authenticated USING (true);

-- Meal Plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_code TEXT UNIQUE NOT NULL,
  plan_name TEXT NOT NULL,
  breakfast BOOLEAN DEFAULT TRUE,
  lunch BOOLEAN DEFAULT TRUE,
  dinner BOOLEAN DEFAULT TRUE,
  duration_days INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10, 2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_meal_plans" ON meal_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_meal_plans" ON meal_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_meal_plans" ON meal_plans FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_meal_plans" ON meal_plans FOR DELETE TO authenticated USING (true);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  amount_paid NUMERIC(10, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'failed')),
  renewed_from UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_subscriptions" ON subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_subscriptions" ON subscriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_subscriptions" ON subscriptions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_subscriptions" ON subscriptions FOR DELETE TO authenticated USING (true);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  transaction_id TEXT,
  payment_gateway TEXT DEFAULT 'manual',
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'failed')),
  paid_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_payments" ON payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_payments" ON payments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_payments" ON payments FOR DELETE TO authenticated USING (true);

-- Meal Logs table
CREATE TABLE IF NOT EXISTS meal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  meal_session TEXT NOT NULL CHECK (meal_session IN ('breakfast', 'lunch', 'dinner')),
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  served_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_meal_logs" ON meal_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_meal_logs" ON meal_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_meal_logs" ON meal_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_meal_logs" ON meal_logs FOR DELETE TO authenticated USING (true);

-- Menus table
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_date DATE NOT NULL UNIQUE,
  breakfast TEXT,
  lunch TEXT,
  dinner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_menus" ON menus FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_menus" ON menus FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_menus" ON menus FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_menus" ON menus FOR DELETE TO authenticated USING (true);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES students(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_announcements" ON announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_announcements" ON announcements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_announcements" ON announcements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_announcements" ON announcements FOR DELETE TO authenticated USING (true);

-- Insert default meal plans
INSERT INTO meal_plans (plan_code, plan_name, breakfast, lunch, dinner, duration_days, price) VALUES
('MONTHLY', 'Monthly Full Board', true, true, true, 30, 4000),
('MONTHLY-LD', 'Monthly Lunch & Dinner', false, true, true, 30, 3000),
('MONTHLY-BD', 'Monthly Breakfast & Dinner', true, false, true, 30, 2500),
('SEMESTER', 'Semester Full Board', true, true, true, 180, 22000),
('WEEKLY', 'Weekly Full Board', true, true, true, 7, 1200)
ON CONFLICT (plan_code) DO NOTHING;
