
-- Create admin user in auth.users and students table
-- We use a service-level approach to create demo users

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
  ('Mess Timing Update', 'Breakfast: 8-10 AM | Lunch: 1-3 PM | Dinner: 8-10 PM. Please ensure you scan your QR within the time slot.', true)
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
