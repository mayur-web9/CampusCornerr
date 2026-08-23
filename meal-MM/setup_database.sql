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

-- ==========================================
-- STEP 3: SEED DEMO DATA (AUTH & APPLICATION)
-- ==========================================

-- Insert admin auth user (password: Admin@123)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@hostelpro.com',
  crypt('Admin@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Insert admin identity
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  provider_id
)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '{"sub": "a0000000-0000-0000-0000-000000000001", "email": "admin@hostelpro.com"}',
  'email',
  NOW(),
  NOW(),
  NOW(),
  'admin@hostelpro.com'
)
ON CONFLICT (provider, provider_id) DO NOTHING;

-- Insert admin student record
INSERT INTO students (id, user_id, student_code, full_name, email, phone, role, profile_completed)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'ADMIN001',
  'Admin User',
  'admin@hostelpro.com',
  '9876543210',
  'admin',
  true
)
ON CONFLICT (student_code) DO NOTHING;

-- Insert staff auth user (password: Staff@123)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'staff@hostelpro.com',
  crypt('Staff@123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Insert staff identity
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  provider_id
)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  '{"sub": "a0000000-0000-0000-0000-000000000002", "email": "staff@hostelpro.com"}',
  'email',
  NOW(),
  NOW(),
  NOW(),
  'staff@hostelpro.com'
)
ON CONFLICT (provider, provider_id) DO NOTHING;

-- Insert staff record
INSERT INTO staff (id, user_id, full_name, email, phone, role, active)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'Ravi Kumar',
  'staff@hostelpro.com',
  '9123456789',
  'staff',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Insert 3 demo student auth users (password: Student@123)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'rahul@hostelpro.com', crypt('Student@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'aman@hostelpro.com', crypt('Student@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'priya@hostelpro.com', crypt('Student@123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider": "email", "providers": ["email"]}', '{}', false, '', '')
ON CONFLICT (id) DO NOTHING;

-- Insert student identities
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
VALUES
  ('a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', '{"sub": "a0000000-0000-0000-0000-000000000003", "email": "rahul@hostelpro.com"}', 'email', NOW(), NOW(), NOW(), 'rahul@hostelpro.com'),
  ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', '{"sub": "a0000000-0000-0000-0000-000000000004", "email": "aman@hostelpro.com"}', 'email', NOW(), NOW(), NOW(), 'aman@hostelpro.com'),
  ('a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', '{"sub": "a0000000-0000-0000-0000-000000000005", "email": "priya@hostelpro.com"}', 'email', NOW(), NOW(), NOW(), 'priya@hostelpro.com')
ON CONFLICT (provider, provider_id) DO NOTHING;

-- Insert demo students
INSERT INTO students (id, user_id, student_code, full_name, email, phone, college_id, room_number, hostel_block, role, profile_completed)
VALUES
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'STU001', 'Rahul Sharma', 'rahul@hostelpro.com', '9876543210', 'CS001', '101', 'Block A', 'student', true),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'STU002', 'Aman Verma', 'aman@hostelpro.com', '9123456780', 'CS002', '102', 'Block A', 'student', true),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005', 'STU003', 'Priya Patel', 'priya@hostelpro.com', '9988776655', 'CS003', '201', 'Block B', 'student', true)
ON CONFLICT (student_code) DO NOTHING;

-- Insert demo subscriptions for students
INSERT INTO subscriptions (student_id, plan_id, amount_paid, start_date, end_date, status, payment_status)
SELECT 
  'b0000000-0000-0000-0000-000000000002',
  id,
  price,
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '25 days',
  'active',
  'paid'
FROM meal_plans WHERE plan_code = 'MONTHLY' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO subscriptions (student_id, plan_id, amount_paid, start_date, end_date, status, payment_status)
SELECT 
  'b0000000-0000-0000-0000-000000000003',
  id,
  price,
  CURRENT_DATE - INTERVAL '10 days',
  CURRENT_DATE + INTERVAL '20 days',
  'active',
  'paid'
FROM meal_plans WHERE plan_code = 'MONTHLY-LD' LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert demo menu for today
INSERT INTO menus (meal_date, breakfast, lunch, dinner)
VALUES (CURRENT_DATE, 'Poha, Tea, Banana', 'Rice, Dal, Mix Veg, Roti, Salad', 'Chapati, Paneer Masala, Veg Pulao, Curd')
ON CONFLICT (meal_date) DO NOTHING;

-- Insert demo announcement
INSERT INTO announcements (title, description, active)
VALUES 
  ('Welcome to HostelPro', 'The new mess management system is now live. Use your credentials to log in and manage your meal subscriptions.', true),
  ('Mess Timing Update', 'Breakfast: 8 AM-10 PM | Lunch: 1-3 PM | Dinner: 8-10 PM. Please ensure you scan your QR within the time slot.', true)
ON CONFLICT DO NOTHING;

-- Insert demo payments
INSERT INTO payments (student_id, subscription_id, amount, payment_gateway, payment_status, paid_at)
SELECT 
  s.student_id,
  s.id,
  s.amount_paid,
  'manual',
  'paid',
  NOW() - INTERVAL '5 days'
FROM subscriptions s
WHERE s.student_id IN ('b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- ==========================================
-- STEP 4: UPDATE ADMIN TO YOUR EMAIL/PASS
-- ==========================================

-- Update admin auth user email and password
UPDATE auth.users
SET 
  email = 'admin@gmail.com',
  encrypted_password = crypt('835751511', gen_salt('bf')),
  updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Update admin identity
UPDATE auth.identities
SET 
  identity_data = '{"sub": "a0000000-0000-0000-0000-000000000001", "email": "admin@gmail.com"}',
  provider_id = 'admin@gmail.com',
  updated_at = NOW()
WHERE user_id = 'a0000000-0000-0000-0000-000000000001';

-- Update admin student record email
UPDATE students
SET email = 'admin@gmail.com', updated_at = NOW()
WHERE id = 'b0000000-0000-0000-0000-000000000001';
