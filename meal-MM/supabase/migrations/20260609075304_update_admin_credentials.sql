
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
