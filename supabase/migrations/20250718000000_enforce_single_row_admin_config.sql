-- Migration: Enforce only one row in admin_config (singleton pattern)
-- You can use a fixed UUID for the single config row
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_config WHERE id = '00000000-0000-0000-0000-000000000000') THEN
    INSERT INTO admin_config (id, deposit_wallet_address, direct_referral_percent, level_income_percent, binary_income_percent, global_royalty_percent, deposit_fee_percent, withdrawal_fee_percent, minimum_withdrawal, minimum_deposit)
    VALUES ('00000000-0000-0000-0000-000000000000', '', 10, '[5,3,2,1,1]', 8, 2, 2, 5, 50, 10);
  END IF;
END $$;

-- Add a constraint to enforce only one row (id must always be the same)
ALTER TABLE admin_config DROP CONSTRAINT IF EXISTS admin_config_singleton_id;
ALTER TABLE admin_config ADD CONSTRAINT admin_config_singleton_id CHECK (id = '00000000-0000-0000-0000-000000000000'); 