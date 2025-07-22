-- Test Package Policies
-- Run this in Supabase SQL Editor to test if policies are working

-- 1. Check current policies
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'packages'
ORDER BY cmd;

-- 2. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'packages';

-- 3. Check admin user status
SELECT 
  id,
  email,
  is_admin,
  is_active
FROM profiles 
WHERE email = 'admin@growwpark.com';

-- 4. Test current user context
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 5. Test if current user can see their profile
SELECT 
  id,
  email,
  is_admin,
  is_active
FROM profiles 
WHERE id = auth.uid();

-- 6. Test the admin check directly
SELECT 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) as is_admin_check; 