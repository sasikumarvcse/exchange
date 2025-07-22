-- Comprehensive Package Admin Fix
-- Run this in Supabase SQL Editor to fix all package admin issues

-- 1. First, ensure the admin user has proper privileges
UPDATE profiles 
SET is_admin = true, is_active = true
WHERE email = 'admin@growwpark.com';

-- 2. Drop any existing conflicting policies
DROP POLICY IF EXISTS "Admin can insert packages" ON packages;
DROP POLICY IF EXISTS "Admin can update packages" ON packages;
DROP POLICY IF EXISTS "Admin can delete packages" ON packages;
DROP POLICY IF EXISTS "Anyone can read packages" ON packages;

-- 3. Recreate all policies for packages table
-- Read policy (for everyone)
CREATE POLICY "Anyone can read packages" ON packages
  FOR SELECT USING (true);

-- Insert policy (for admins only)
CREATE POLICY "Admin can insert packages" ON packages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Update policy (for admins only)
CREATE POLICY "Admin can update packages" ON packages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Delete policy (for admins only)
CREATE POLICY "Admin can delete packages" ON packages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 4. Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'packages'
ORDER BY cmd;

-- 5. Test admin user status
SELECT 
  id,
  email,
  is_admin,
  is_active
FROM profiles 
WHERE email = 'admin@growwpark.com';

-- 6. Test if current user can see their profile
SELECT 
  id,
  email,
  is_admin,
  is_active
FROM profiles 
WHERE id = auth.uid(); 