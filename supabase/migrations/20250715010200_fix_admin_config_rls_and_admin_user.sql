-- Ensure correct RLS policies for admin_config
-- Allow anyone to read
CREATE POLICY IF NOT EXISTS "Anyone can read config" ON admin_config
  FOR SELECT USING (true);
-- Allow only admins to update
CREATE POLICY IF NOT EXISTS "Admin can update config" ON admin_config
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
-- Allow only admins to insert
CREATE POLICY IF NOT EXISTS "Admin can insert config" ON admin_config
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Ensure RLS is enabled
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;

-- Make sure your user is an admin (replace YOUR_EMAIL with your email)
UPDATE profiles SET is_admin = true WHERE email = 'YOUR_EMAIL';

-- Check if admin_config row exists
SELECT * FROM admin_config; 