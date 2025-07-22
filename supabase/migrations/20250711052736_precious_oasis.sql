-- Supabase Auth-Integrated Schema for MLM Platform

-- 1. PROFILES TABLE (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gpk_id text UNIQUE,
  name text,
  email text UNIQUE,
  phone text,
  referral_code text UNIQUE,
  sponsor_id uuid REFERENCES profiles(id),
  wallet_address text,
  package_id text,
  is_active boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  join_date timestamptz DEFAULT now(),
  right_count integer DEFAULT 0,
  total_earnings decimal DEFAULT 0,
  wallet_balance decimal DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. TRIGGER: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. PACKAGES TABLE
CREATE TABLE IF NOT EXISTS packages (
  id text PRIMARY KEY,
  name text NOT NULL,
  price decimal NOT NULL,
  roi decimal NOT NULL,
  benefits jsonb NOT NULL DEFAULT '[]',
  description text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. INCOMES TABLE
CREATE TABLE IF NOT EXISTS incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('direct', 'level', 'binary', 'royalty')),
  amount decimal NOT NULL,
  from_user_id uuid REFERENCES profiles(id),
  level integer,
  package_id text,
  description text NOT NULL,
  date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 5. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount decimal NOT NULL,
  tx_hash text,
  wallet_address text,
  status text NOT NULL CHECK (status IN ('pending', 'verified', 'rejected', 'completed')),
  admin_fee decimal DEFAULT 0,
  reference_id text,
  date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. ADMIN CONFIG TABLE
CREATE TABLE IF NOT EXISTS admin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_wallet_address text NOT NULL DEFAULT '0x742d35Cc6634C0532925a3b8D4Ea83E2b16A6C4a',
  direct_referral_percent decimal NOT NULL DEFAULT 10,
  level_income_percent jsonb NOT NULL DEFAULT '[5, 3, 2, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5]',
  binary_income_percent decimal NOT NULL DEFAULT 8,
  global_royalty_percent decimal NOT NULL DEFAULT 2,
  deposit_fee_percent decimal NOT NULL DEFAULT 2,
  withdrawal_fee_percent decimal NOT NULL DEFAULT 5,
  minimum_withdrawal decimal NOT NULL DEFAULT 50,
  minimum_deposit decimal NOT NULL DEFAULT 10,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO admin_config (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- 7. DEFAULT PACKAGES
INSERT INTO packages (id, name, price, roi, benefits, description) VALUES
('package1', 'Starter', 100, 150, '["Direct Referral Income: 10%", "Level Income: 5 levels", "Binary Income: Not Available", "Global Royalty: Not Available", "Basic Support", "Mobile App Access"]', 'Perfect for beginners starting their MLM journey'),
('package2', 'Silver', 500, 200, '["Direct Referral Income: 12%", "Level Income: 7 levels", "Binary Income: 8%", "Global Royalty: 1%", "Priority Support", "Advanced Analytics", "Team Building Tools"]', 'Enhanced features for growing your network'),
('package3', 'Gold', 1000, 300, '["Direct Referral Income: 15%", "Level Income: 10 levels", "Binary Income: 10%", "Global Royalty: 2%", "VIP Support", "Leadership Training", "Marketing Materials", "Monthly Webinars"]', 'Premium package with maximum benefits'),
('package4', 'Platinum', 2500, 400, '["Direct Referral Income: 18%", "Level Income: 12 levels", "Binary Income: 12%", "Global Royalty: 3%", "Dedicated Support Manager", "Leadership Bonus: 5%", "Travel Incentives", "Personal Branding Kit"]', 'Elite package for serious network builders'),
('package5', 'Diamond', 5000, 500, '["Direct Referral Income: 20%", "Level Income: 15 levels", "Binary Income: 15%", "Global Royalty: 5%", "Personal Success Coach", "Leadership Bonus: 10%", "Car Fund Bonus", "Annual Recognition Events", "Custom Commission Structure"]', 'Ultimate package for top performers and leaders')
ON CONFLICT (id) DO NOTHING;

-- 8. REFERRALS TABLE
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 9. ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS net_amount decimal DEFAULT 0;

-- 10. RLS POLICIES
-- Profiles
CREATE POLICY "Users can view/update their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow all users to select profiles" ON profiles
  FOR SELECT USING (true);

-- Packages
CREATE POLICY "Anyone can read packages" ON packages
  FOR SELECT USING (true);

-- Incomes
CREATE POLICY "Users can read own incomes" ON incomes
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert incomes" ON incomes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Transactions
CREATE POLICY "Users can read own transactions" ON transactions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Referrals
CREATE POLICY "Allow referrer to read their referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Allow insert for referrer or referred" ON referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Admin Config (allow all users to read, only admins to update)
CREATE POLICY "Anyone can read config" ON admin_config
  FOR SELECT USING (true);
CREATE POLICY "Admin can update config" ON admin_config
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admin can insert config" ON admin_config
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 11. INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_sponsor_id ON profiles(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_type ON incomes(type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- 12. TRIGGERS FOR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_config_updated_at BEFORE UPDATE ON admin_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger function to credit wallet on verified deposit (prevent double-counting)
CREATE OR REPLACE FUNCTION credit_wallet_on_verified_deposit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'deposit' AND NEW.status = 'verified' AND (OLD.status IS DISTINCT FROM 'verified') THEN
    UPDATE profiles
    SET wallet_balance = wallet_balance + NEW.amount
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_credit_wallet_on_verified_deposit ON transactions;
CREATE TRIGGER trg_credit_wallet_on_verified_deposit
AFTER UPDATE ON transactions
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION credit_wallet_on_verified_deposit();

-- Trigger function to deduct wallet on completed/verified withdrawal
CREATE OR REPLACE FUNCTION deduct_wallet_on_completed_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'withdrawal' AND (NEW.status = 'completed' OR NEW.status = 'verified') AND OLD.status <> NEW.status THEN
    UPDATE profiles
    SET wallet_balance = wallet_balance - NEW.amount
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deduct_wallet_on_completed_withdrawal ON transactions;
CREATE TRIGGER trg_deduct_wallet_on_completed_withdrawal
AFTER UPDATE ON transactions
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION deduct_wallet_on_completed_withdrawal();

-- 13. ADD MISSING ADMIN POLICIES FOR PACKAGES
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