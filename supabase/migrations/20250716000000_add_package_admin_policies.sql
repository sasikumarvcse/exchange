-- Add admin policies for packages table to allow CRUD operations
-- This migration adds the missing INSERT, UPDATE, and DELETE policies for admins

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