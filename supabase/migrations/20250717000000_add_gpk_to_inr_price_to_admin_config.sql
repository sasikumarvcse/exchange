-- Add GPK to INR price column to admin_config
ALTER TABLE admin_config ADD COLUMN IF NOT EXISTS gpk_to_inr_price decimal DEFAULT 100; 