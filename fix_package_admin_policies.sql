-- Fix Package Admin Policies
-- Run this in your Supabase SQL Editor to enable admin CRUD operations on packages

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admin can insert packages" ON packages;
DROP POLICY IF EXISTS "Admin can update packages" ON packages;
DROP POLICY IF EXISTS "Admin can delete packages" ON packages;

-- Admin can insert packages
CREATE POLICY "Admin can insert packages" ON packages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admin can update packages
CREATE POLICY "Admin can update packages" ON packages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admin can delete packages
CREATE POLICY "Admin can delete packages" ON packages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'packages'; 