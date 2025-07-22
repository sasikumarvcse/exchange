-- Setup Admin Account
-- Run this in Supabase SQL Editor to ensure admin@growwpark.com has proper admin privileges

-- First, let's see if the admin user exists
SELECT id, name, email, is_admin, is_active 
FROM profiles 
WHERE email = 'admin@growwpark.com';

-- Create or update the admin user
INSERT INTO profiles (id, email, name, is_admin, is_active, gpk_id, referral_code)
VALUES (
  gen_random_uuid(),
  'admin@growwpark.com',
  'Admin User',
  true,
  true,
  'ADMIN001',
  'ADMIN001'
)
ON CONFLICT (email) DO UPDATE SET 
  is_admin = true, 
  is_active = true,
  name = 'Admin User';

-- Verify the admin user is set up correctly
SELECT id, name, email, is_admin, is_active, gpk_id, referral_code
FROM profiles 
WHERE email = 'admin@growwpark.com';

-- Check all admin users
SELECT id, name, email, is_admin, is_active 
FROM profiles 
WHERE is_admin = true;

-- Ensure admin@growwpark.com is the only admin (optional - remove other admin users)
-- UPDATE profiles SET is_admin = false WHERE email != 'admin@growwpark.com' AND is_admin = true; 