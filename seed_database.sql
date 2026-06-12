-- ==========================================
-- STEP 1: CLEAN UP EXISTING DATA
-- ==========================================
DELETE FROM auth.users;
DELETE FROM auth.identities;
DELETE FROM students;
DELETE FROM staff;
DELETE FROM subscriptions;
DELETE FROM payments;
DELETE FROM announcements;

-- ==========================================
-- STEP 2: INSERT AUTH USERS (PASSWORD HASHED)
-- ==========================================

-- 1. Admin (Email: admin@gmail.com, Password: admin_pass_crypt)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'admin@gmail.com',
  crypt('835751511', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false, '', ''
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id
)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '{"sub": "a0000000-0000-0000-0000-000000000001", "email": "admin@gmail.com"}',
  'email',
  NOW(), NOW(), NOW(),
  'admin@gmail.com'
);

-- 2. Staff (Email: staff@hostelpro.com, Password: Staff@123)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'staff@hostelpro.com',
  crypt('Staff@123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false, '', ''
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id
)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  '{"sub": "a0000000-0000-0000-0000-000000000002", "email": "staff@hostelpro.com"}',
  'email',
  NOW(), NOW(), NOW(),
  'staff@hostelpro.com'
);

-- 3. Student 1: Rahul (Email: rahul@hostelpro.com, Password: Student@123)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000003',
  'authenticated',
  'authenticated',
  'rahul@hostelpro.com',
  crypt('Student@123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false, '', ''
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id
)
VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000003',
  '{"sub": "a0000000-0000-0000-0000-000000000003", "email": "rahul@hostelpro.com"}',
  'email',
  NOW(), NOW(), NOW(),
  'rahul@hostelpro.com'
);

-- 4. Student 2: Aman (Email: aman@hostelpro.com, Password: Student@123)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000004',
  'authenticated',
  'authenticated',
  'aman@hostelpro.com',
  crypt('Student@123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false, '', ''
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id
)
VALUES (
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000004',
  '{"sub": "a0000000-0000-0000-0000-000000000004", "email": "aman@hostelpro.com"}',
  'email',
  NOW(), NOW(), NOW(),
  'aman@hostelpro.com'
);

-- 5. Student 3: Priya (Email: priya@hostelpro.com, Password: Student@123)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000005',
  'authenticated',
  'authenticated',
  'priya@hostelpro.com',
  crypt('Student@123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false, '', ''
);

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id
)
VALUES (
  'a0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000005',
  '{"sub": "a0000000-0000-0000-0000-000000000005", "email": "priya@hostelpro.com"}',
  'email',
  NOW(), NOW(), NOW(),
  'priya@hostelpro.com'
);

-- ==========================================
-- STEP 3: INSERT APP PROFILES & RELATIONS
-- ==========================================

-- Admin student record
INSERT INTO students (id, user_id, student_code, full_name, email, phone, role, profile_completed)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'ADMIN001',
  'Admin User',
  'admin@gmail.com',
  '9876543210',
  'admin',
  true
);

-- Staff record
INSERT INTO staff (id, user_id, full_name, email, phone, role, active)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'Ravi Kumar',
  'staff@hostelpro.com',
  '9123456789',
  'staff',
  true
);

-- Students
INSERT INTO students (id, user_id, student_code, full_name, email, phone, college_id, room_number, hostel_block, role, profile_completed)
VALUES
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'STU001', 'Rahul Sharma', 'rahul@hostelpro.com', '9876543210', 'CS001', '101', 'Block A', 'student', true),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'STU002', 'Aman Verma', 'aman@hostelpro.com', '9123456780', 'CS002', '102', 'Block A', 'student', true),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005', 'STU003', 'Priya Patel', 'priya@hostelpro.com', '9988776655', 'CS003', '201', 'Block B', 'student', true);

-- Subscriptions for students
INSERT INTO subscriptions (student_id, plan_id, amount_paid, start_date, end_date, status, payment_status)
SELECT 
  'b0000000-0000-0000-0000-000000000002',
  id,
  price,
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '25 days',
  'active',
  'paid'
FROM meal_plans WHERE plan_code = 'MONTHLY' LIMIT 1;

INSERT INTO subscriptions (student_id, plan_id, amount_paid, start_date, end_date, status, payment_status)
SELECT 
  'b0000000-0000-0000-0000-000000000003',
  id,
  price,
  CURRENT_DATE - INTERVAL '10 days',
  CURRENT_DATE + INTERVAL '20 days',
  'active',
  'paid'
FROM meal_plans WHERE plan_code = 'MONTHLY-LD' LIMIT 1;

-- Menu for today
INSERT INTO menus (meal_date, breakfast, lunch, dinner)
VALUES (CURRENT_DATE, 'Poha, Tea, Banana', 'Rice, Dal, Mix Veg, Roti, Salad', 'Chapati, Paneer Masala, Veg Pulao, Curd')
ON CONFLICT (meal_date) DO NOTHING;

-- Announcements
INSERT INTO announcements (title, description, active)
VALUES 
  ('Welcome to HostelPro', 'The new mess management system is now live. Use your credentials to log in and manage your meal subscriptions.', true),
  ('Mess Timing Update', 'Breakfast: 8 AM-10 PM | Lunch: 1-3 PM | Dinner: 8-10 PM. Please ensure you scan your QR within the time slot.', true);

-- Payments
INSERT INTO payments (student_id, subscription_id, amount, payment_gateway, payment_status, paid_at)
SELECT 
  s.student_id,
  s.id,
  s.amount_paid,
  'manual',
  'paid',
  NOW() - INTERVAL '5 days'
FROM subscriptions s
WHERE s.student_id IN ('b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003');
