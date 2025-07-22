-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Set up admin user (replace with your admin email)
UPDATE profiles SET is_admin = true WHERE email = 'admin@growwpark.com';

-- Create admin user if doesn't exist
INSERT INTO profiles (id, email, is_admin, name) 
VALUES (
  gen_random_uuid(), 
  'admin@growwpark.com', 
  true, 
  'System Admin'
) ON CONFLICT (email) DO UPDATE SET is_admin = true;

-- Ensure admin_config table has at least one record
INSERT INTO admin_config (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING; 