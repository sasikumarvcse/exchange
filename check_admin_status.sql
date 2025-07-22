-- Check Admin Status and RLS Policies
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if the current user exists and has admin privileges
SELECT 
  id,
  email,
  is_admin,
  is_active,
  created_at
FROM profiles 
WHERE email = 'admin@growwpark.com';

-- 2. Check all RLS policies on the packages table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'packages'
ORDER BY cmd;

-- 3. Check if RLS is enabled on packages table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'packages';

-- 4. Test if current user can see their own profile
SELECT 
  id,
  email,
  is_admin,
  is_active
FROM profiles 
WHERE id = auth.uid(); 